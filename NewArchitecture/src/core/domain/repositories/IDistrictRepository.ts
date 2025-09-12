/**
 * District Repository Interface
 * Domain layer repository contract for District entity
 */

import { District } from '../entities/District';

export interface IDistrictRepository {
  // Basic CRUD operations
  findById(id: string): Promise<District | null>;
  findByCode(code: string): Promise<District | null>;
  findByName(name: string): Promise<District | null>;
  findAll(): Promise<District[]>;
  save(district: District): Promise<District>;
  update(id: string, district: Partial<District>): Promise<District | null>;
  delete(id: string): Promise<boolean>;
  
  // Region management
  findByRegion(region: string): Promise<District[]>;
  getRegions(): Promise<string[]>;
  
  // Status management
  findActive(): Promise<District[]>;
  findInactive(): Promise<District[]>;
  activate(id: string): Promise<boolean>;
  deactivate(id: string): Promise<boolean>;
  
  // Geographic queries
  findUrbanDistricts(): Promise<District[]>;
  findRuralDistricts(): Promise<District[]>;
  findByPopulationRange(min: number, max: number): Promise<District[]>;
  findByAreaRange(min: number, max: number): Promise<District[]>;
  
  // Employee count management
  updateEmployeeCount(id: string, count: number): Promise<boolean>;
  incrementEmployeeCount(id: string): Promise<boolean>;
  decrementEmployeeCount(id: string): Promise<boolean>;
  recalculateEmployeeCount(id: string): Promise<number>;
  
  // Statistics
  countTotal(): Promise<number>;
  countActive(): Promise<number>;
  countByRegion(): Promise<Record<string, number>>;
  getTotalPopulation(): Promise<number>;
  getTotalArea(): Promise<number>;
  getEmployeeCountStatistics(): Promise<any>;
  getPopulationStatistics(): Promise<any>;
  
  // Check existence
  exists(id: string): Promise<boolean>;
  existsByCode(code: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}