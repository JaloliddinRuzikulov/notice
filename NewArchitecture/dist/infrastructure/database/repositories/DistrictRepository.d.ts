/**
 * District Repository Implementation
 */
import { IDistrictRepository } from '@/core/domain/repositories/IDistrictRepository';
import { District } from '@/core/domain/entities/District';
export declare class DistrictRepository implements IDistrictRepository {
    private districts;
    findById(id: string): Promise<District | null>;
    findByCode(code: string): Promise<District | null>;
    findByName(name: string): Promise<District | null>;
    findAll(): Promise<District[]>;
    save(district: District): Promise<District>;
    update(id: string, district: Partial<District>): Promise<District | null>;
    delete(id: string): Promise<boolean>;
    findByRegion(region: string): Promise<District[]>;
    getRegions(): Promise<string[]>;
    findActive(): Promise<District[]>;
    findInactive(): Promise<District[]>;
    activate(id: string): Promise<boolean>;
    deactivate(id: string): Promise<boolean>;
    findUrbanDistricts(): Promise<District[]>;
    findRuralDistricts(): Promise<District[]>;
    findByPopulationRange(min: number, max: number): Promise<District[]>;
    findByAreaRange(min: number, max: number): Promise<District[]>;
    updateEmployeeCount(id: string, count: number): Promise<boolean>;
    incrementEmployeeCount(id: string): Promise<boolean>;
    decrementEmployeeCount(id: string): Promise<boolean>;
    recalculateEmployeeCount(id: string): Promise<number>;
    countTotal(): Promise<number>;
    countActive(): Promise<number>;
    countByRegion(): Promise<Record<string, number>>;
    getTotalPopulation(): Promise<number>;
    getTotalArea(): Promise<number>;
    getEmployeeCountStatistics(): Promise<any>;
    getPopulationStatistics(): Promise<any>;
    exists(id: string): Promise<boolean>;
    existsByCode(code: string): Promise<boolean>;
    existsByName(name: string): Promise<boolean>;
}
//# sourceMappingURL=DistrictRepository.d.ts.map