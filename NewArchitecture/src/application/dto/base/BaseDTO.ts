/**
 * Base DTO class with common properties
 */

export abstract class BaseDTO {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: { id: string; createdAt: Date; updatedAt: Date }) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

export interface ApiResponseDTO<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}