"use strict";
/**
 * District Repository Implementation
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictRepository = void 0;
const tsyringe_1 = require("tsyringe");
const District_1 = require("@/core/domain/entities/District");
let DistrictRepository = class DistrictRepository {
    districts = new Map();
    async findById(id) {
        return this.districts.get(id) || null;
    }
    async findByCode(code) {
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.code === code) {
                return district;
            }
        }
        return null;
    }
    async findByName(name) {
        for (const district of this.districts.values()) {
            if (district.name === name) {
                return district;
            }
        }
        return null;
    }
    async findAll() {
        return Array.from(this.districts.values());
    }
    async save(district) {
        if (!district.id) {
            throw new Error('District must have an ID');
        }
        this.districts.set(district.id, district);
        return district;
    }
    async update(id, district) {
        const existing = await this.findById(id);
        if (!existing)
            return null;
        // Update fields
        Object.assign(existing, district);
        this.districts.set(id, existing);
        return existing;
    }
    async delete(id) {
        return this.districts.delete(id);
    }
    // Region management
    async findByRegion(region) {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.region === region) {
                results.push(district);
            }
        }
        return results;
    }
    async getRegions() {
        const regions = new Set();
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.region) {
                regions.add(obj.region);
            }
        }
        return Array.from(regions);
    }
    // Status management
    async findActive() {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.isActive) {
                results.push(district);
            }
        }
        return results;
    }
    async findInactive() {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (!obj.isActive) {
                results.push(district);
            }
        }
        return results;
    }
    async activate(id) {
        const district = await this.findById(id);
        if (!district)
            return false;
        const obj = district.toObject();
        obj.isActive = true;
        const updated = District_1.District.create(obj);
        this.districts.set(id, updated);
        return true;
    }
    async deactivate(id) {
        const district = await this.findById(id);
        if (!district)
            return false;
        const obj = district.toObject();
        obj.isActive = false;
        const updated = District_1.District.create(obj);
        this.districts.set(id, updated);
        return true;
    }
    // Geographic queries
    async findUrbanDistricts() {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            // Consider districts with population > 100,000 as urban
            if (obj.population && obj.population > 100000) {
                results.push(district);
            }
        }
        return results;
    }
    async findRuralDistricts() {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            // Consider districts with population <= 100,000 as rural
            if (!obj.population || obj.population <= 100000) {
                results.push(district);
            }
        }
        return results;
    }
    async findByPopulationRange(min, max) {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.population >= min && obj.population <= max) {
                results.push(district);
            }
        }
        return results;
    }
    async findByAreaRange(min, max) {
        const results = [];
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.area >= min && obj.area <= max) {
                results.push(district);
            }
        }
        return results;
    }
    // Employee count management
    async updateEmployeeCount(id, count) {
        const district = await this.findById(id);
        if (!district)
            return false;
        const obj = district.toObject();
        obj.employeeCount = count;
        const updated = District_1.District.create(obj);
        this.districts.set(id, updated);
        return true;
    }
    async incrementEmployeeCount(id) {
        const district = await this.findById(id);
        if (!district)
            return false;
        const obj = district.toObject();
        obj.employeeCount = (obj.employeeCount || 0) + 1;
        const updated = District_1.District.create(obj);
        this.districts.set(id, updated);
        return true;
    }
    async decrementEmployeeCount(id) {
        const district = await this.findById(id);
        if (!district)
            return false;
        const obj = district.toObject();
        obj.employeeCount = Math.max(0, (obj.employeeCount || 0) - 1);
        const updated = District_1.District.create(obj);
        this.districts.set(id, updated);
        return true;
    }
    async recalculateEmployeeCount(id) {
        // In real implementation, this would query employees table
        // For now, return 0
        await this.updateEmployeeCount(id, 0);
        return 0;
    }
    // Statistics
    async countTotal() {
        return this.districts.size;
    }
    async countActive() {
        let count = 0;
        for (const district of this.districts.values()) {
            if (district.toObject().isActive) {
                count++;
            }
        }
        return count;
    }
    async countByRegion() {
        const counts = {};
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            if (obj.region) {
                counts[obj.region] = (counts[obj.region] || 0) + 1;
            }
        }
        return counts;
    }
    async getTotalPopulation() {
        let total = 0;
        for (const district of this.districts.values()) {
            total += district.toObject().population || 0;
        }
        return total;
    }
    async getTotalArea() {
        let total = 0;
        for (const district of this.districts.values()) {
            total += district.toObject().area || 0;
        }
        return total;
    }
    async getEmployeeCountStatistics() {
        const stats = {
            totalDistricts: this.districts.size,
            totalEmployees: 0,
            districtCounts: {}
        };
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            const count = obj.employeeCount || 0;
            stats.totalEmployees += count;
            stats.districtCounts[obj.name] = count;
        }
        return stats;
    }
    async getPopulationStatistics() {
        const stats = {
            totalPopulation: 0,
            urbanPopulation: 0,
            ruralPopulation: 0,
            averagePopulation: 0,
            districtPopulations: {}
        };
        for (const district of this.districts.values()) {
            const obj = district.toObject();
            const pop = obj.population || 0;
            stats.totalPopulation += pop;
            // Consider districts with population > 100,000 as urban
            if (obj.population && obj.population > 100000) {
                stats.urbanPopulation += pop;
            }
            else {
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
    async exists(id) {
        return this.districts.has(id);
    }
    async existsByCode(code) {
        for (const district of this.districts.values()) {
            if (district.toObject().code === code) {
                return true;
            }
        }
        return false;
    }
    async existsByName(name) {
        for (const district of this.districts.values()) {
            if (district.name === name) {
                return true;
            }
        }
        return false;
    }
};
exports.DistrictRepository = DistrictRepository;
exports.DistrictRepository = DistrictRepository = __decorate([
    (0, tsyringe_1.injectable)()
], DistrictRepository);
//# sourceMappingURL=DistrictRepository.js.map