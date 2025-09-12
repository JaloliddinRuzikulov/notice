/**
 * Employee Mapper
 * Maps between Employee Domain Entity and DTOs
 */
import { Employee } from '@/core/domain/entities/Employee';
export declare class EmployeeMapper {
    toDTO(entity: Employee): any;
    toDomain(dto: any): Employee;
    toDTOList(entities: Employee[]): any[];
    toDomainList(dtos: any[]): Employee[];
}
//# sourceMappingURL=EmployeeMapper.d.ts.map