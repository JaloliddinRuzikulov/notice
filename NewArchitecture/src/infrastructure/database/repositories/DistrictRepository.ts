/**
 * District Repository Implementation
 */

import { injectable } from 'tsyringe';
import { IDistrictRepository } from '@/core/domain/repositories/IDistrictRepository';
import { District } from '@/core/domain/entities/District';

@injectable()
export class DistrictRepository implements IDistrictRepository {
  private districts: Map<string, District> = new Map();

  async findById(id: string): Promise<District | null> {
    return this.districts.get(id) || null;
  }

  async findByCode(code: string): Promise<District | null> {
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.code === code) {
        return district;
      }
    }
    return null;
  }

  async findByName(name: string): Promise<District | null> {
    for (const district of this.districts.values()) {
      if (district.name === name) {
        return district;
      }
    }
    return null;
  }

  async findAll(): Promise<District[]> {
    return Array.from(this.districts.values());
  }

  async save(district: District): Promise<District> {
    if (!district.id) {
      throw new Error('District must have an ID');
    }
    this.districts.set(district.id, district);
    return district;
  }

  async update(id: string, district: Partial<District>): Promise<District | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    
    // Update fields
    Object.assign(existing, district);
    this.districts.set(id, existing);
    return existing;
  }

  async delete(id: string): Promise<boolean> {
    return this.districts.delete(id);
  }

  // Region management
  async findByRegion(region: string): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.region === region) {
        results.push(district);
      }
    }
    return results;
  }

  async getRegions(): Promise<string[]> {
    const regions = new Set<string>();
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.region) {
        regions.add(obj.region);
      }
    }
    return Array.from(regions);
  }

  // Status management
  async findActive(): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.isActive) {
        results.push(district);
      }
    }
    return results;
  }

  async findInactive(): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (!obj.isActive) {
        results.push(district);
      }
    }
    return results;
  }

  async activate(id: string): Promise<boolean> {
    const district = await this.findById(id);
    if (!district) return false;
    
    const obj = district.toObject();
    obj.isActive = true;
    const updated = District.create(obj);
    this.districts.set(id, updated);
    return true;
  }

  async deactivate(id: string): Promise<boolean> {
    const district = await this.findById(id);
    if (!district) return false;
    
    const obj = district.toObject();
    obj.isActive = false;
    const updated = District.create(obj);
    this.districts.set(id, updated);
    return true;
  }

  // Geographic queries
  async findUrbanDistricts(): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      // Consider districts with population > 100,000 as urban
      if (obj.population && obj.population > 100000) {
        results.push(district);
      }
    }
    return results;
  }

  async findRuralDistricts(): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      // Consider districts with population <= 100,000 as rural
      if (!obj.population || obj.population <= 100000) {
        results.push(district);
      }
    }
    return results;
  }

  async findByPopulationRange(min: number, max: number): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.population >= min && obj.population <= max) {
        results.push(district);
      }
    }
    return results;
  }

  async findByAreaRange(min: number, max: number): Promise<District[]> {
    const results: District[] = [];
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.area >= min && obj.area <= max) {
        results.push(district);
      }
    }
    return results;
  }

  // Employee count management
  async updateEmployeeCount(id: string, count: number): Promise<boolean> {
    const district = await this.findById(id);
    if (!district) return false;
    
    const obj = district.toObject();
    obj.employeeCount = count;
    const updated = District.create(obj);
    this.districts.set(id, updated);
    return true;
  }

  async incrementEmployeeCount(id: string): Promise<boolean> {
    const district = await this.findById(id);
    if (!district) return false;
    
    const obj = district.toObject();
    obj.employeeCount = (obj.employeeCount || 0) + 1;
    const updated = District.create(obj);
    this.districts.set(id, updated);
    return true;
  }

  async decrementEmployeeCount(id: string): Promise<boolean> {
    const district = await this.findById(id);
    if (!district) return false;
    
    const obj = district.toObject();
    obj.employeeCount = Math.max(0, (obj.employeeCount || 0) - 1);
    const updated = District.create(obj);
    this.districts.set(id, updated);
    return true;
  }

  async recalculateEmployeeCount(id: string): Promise<number> {
    // In real implementation, this would query employees table
    // For now, return 0
    await this.updateEmployeeCount(id, 0);
    return 0;
  }

  // Statistics
  async countTotal(): Promise<number> {
    return this.districts.size;
  }

  async countActive(): Promise<number> {
    let count = 0;
    for (const district of this.districts.values()) {
      if (district.toObject().isActive) {
        count++;
      }
    }
    return count;
  }

  async countByRegion(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      if (obj.region) {
        counts[obj.region] = (counts[obj.region] || 0) + 1;
      }
    }
    return counts;
  }

  async getTotalPopulation(): Promise<number> {
    let total = 0;
    for (const district of this.districts.values()) {
      total += district.toObject().population || 0;
    }
    return total;
  }

  async getTotalArea(): Promise<number> {
    let total = 0;
    for (const district of this.districts.values()) {
      total += district.toObject().area || 0;
    }
    return total;
  }

  async getEmployeeCountStatistics(): Promise<any> {
    const stats = {
      totalDistricts: this.districts.size,
      totalEmployees: 0,
      districtCounts: {} as Record<string, number>
    };
    
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      const count = obj.employeeCount || 0;
      stats.totalEmployees += count;
      stats.districtCounts[obj.name] = count;
    }
    
    return stats;
  }

  async getPopulationStatistics(): Promise<any> {
    const stats = {
      totalPopulation: 0,
      urbanPopulation: 0,
      ruralPopulation: 0,
      averagePopulation: 0,
      districtPopulations: {} as Record<string, number>
    };
    
    for (const district of this.districts.values()) {
      const obj = district.toObject();
      const pop = obj.population || 0;
      stats.totalPopulation += pop;
      // Consider districts with population > 100,000 as urban
      if (obj.population && obj.population > 100000) {
        stats.urbanPopulation += pop;
      } else {
        stats.ruralPopulation += pop;
      }
      stats.districtPopulations[obj.name] = pop;
    }
    
    if (this.districts.size > 0) {
      stats.averagePopulation = stats.totalPopulation / this.districts.size;
    }
    
    return stats;
  }

  // Check existence
  async exists(id: string): Promise<boolean> {
    return this.districts.has(id);
  }

  async existsByCode(code: string): Promise<boolean> {
    for (const district of this.districts.values()) {
      if (district.toObject().code === code) {
        return true;
      }
    }
    return false;
  }

  async existsByName(name: string): Promise<boolean> {
    for (const district of this.districts.values()) {
      if (district.name === name) {
        return true;
      }
    }
    return false;
  }
}