/**
 * User Mapper
 * Maps between User Domain Entity and DTOs
 */
import { User } from '@/core/domain/entities/User';
export declare class UserMapper {
    toDTO(entity: User): any;
    toDomain(dto: any): User;
    toDTOList(entities: User[]): any[];
    toDomainList(dtos: any[]): User[];
    toProfileDTO(entity: User): any;
}
//# sourceMappingURL=UserMapper.d.ts.map