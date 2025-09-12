/**
 * Broadcast Mapper
 * Maps between Broadcast Domain Entity and DTOs
 */
import { Broadcast } from '@/core/domain/entities/Broadcast';
export declare class BroadcastMapper {
    toDTO(entity: Broadcast): any;
    toDomain(dto: any): Broadcast;
    toDTOList(entities: Broadcast[]): any[];
    toDomainList(dtos: any[]): Broadcast[];
    toSummaryDTO(entity: Broadcast): any;
    toStartResponseDTO(entity: Broadcast): any;
    toStatusDTO(broadcast: Broadcast, progress?: any, callHistory?: any[]): any;
}
//# sourceMappingURL=BroadcastMapper.d.ts.map