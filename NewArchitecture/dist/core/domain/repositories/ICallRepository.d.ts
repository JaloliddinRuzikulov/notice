/**
 * Call Repository Interface
 * Domain layer repository contract for Call entity
 */
import { Call, CallStatus, CallDirection, CallType } from '../entities/Call';
export interface CallSearchCriteria {
    from?: string;
    to?: string;
    direction?: CallDirection;
    type?: CallType;
    status?: CallStatus;
    broadcastId?: string;
    employeeId?: string;
    sipExtension?: string;
    startDate?: Date;
    endDate?: Date;
}
export interface CallStatistics {
    totalCalls: number;
    answeredCalls: number;
    failedCalls: number;
    busyCalls: number;
    noAnswerCalls: number;
    averageDuration: number;
    averageWaitTime: number;
    answerRate: number;
    totalDuration: number;
}
export interface ICallRepository {
    findById(id: string): Promise<Call | null>;
    findByCallId(callId: string): Promise<Call | null>;
    findAll(): Promise<Call[]>;
    save(call: Call): Promise<Call>;
    update(id: string, call: Partial<Call>): Promise<Call | null>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: CallStatus): Promise<Call[]>;
    findActive(): Promise<Call[]>;
    findCompleted(): Promise<Call[]>;
    findFailed(): Promise<Call[]>;
    updateStatus(id: string, status: CallStatus): Promise<boolean>;
    startCall(call: Call): Promise<Call>;
    answerCall(id: string): Promise<boolean>;
    completeCall(id: string, duration: number): Promise<boolean>;
    failCall(id: string, reason: string): Promise<boolean>;
    cancelCall(id: string): Promise<boolean>;
    search(criteria: CallSearchCriteria): Promise<Call[]>;
    findByPhoneNumber(phoneNumber: string): Promise<Call[]>;
    findByEmployee(employeeId: string): Promise<Call[]>;
    findByBroadcast(broadcastId: string): Promise<Call[]>;
    findBySipExtension(extension: string): Promise<Call[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<Call[]>;
    findInbound(): Promise<Call[]>;
    findOutbound(): Promise<Call[]>;
    findByType(type: CallType): Promise<Call[]>;
    updateRecording(id: string, recordingUrl: string): Promise<boolean>;
    findWithRecordings(): Promise<Call[]>;
    findWithoutRecordings(): Promise<Call[]>;
    updateDtmfInput(id: string, dtmfInput: string): Promise<boolean>;
    findByDtmfInput(dtmfInput: string): Promise<Call[]>;
    getStatistics(startDate?: Date, endDate?: Date): Promise<CallStatistics>;
    getStatisticsByEmployee(employeeId: string): Promise<CallStatistics>;
    getStatisticsByBroadcast(broadcastId: string): Promise<CallStatistics>;
    getStatisticsBySipExtension(extension: string): Promise<CallStatistics>;
    getDailyStatistics(date: Date): Promise<CallStatistics>;
    getHourlyStatistics(date: Date, hour: number): Promise<CallStatistics>;
    getHistory(limit?: number): Promise<Call[]>;
    getHistoryByEmployee(employeeId: string, limit?: number): Promise<Call[]>;
    getHistoryByPhoneNumber(phoneNumber: string, limit?: number): Promise<Call[]>;
    getActiveCalls(): Promise<Call[]>;
    getActiveCallCount(): Promise<number>;
    getActiveCallsBySipExtension(extension: string): Promise<Call[]>;
    deleteMany(ids: string[]): Promise<number>;
    deleteOldCalls(beforeDate: Date): Promise<number>;
    exists(id: string): Promise<boolean>;
    existsByCallId(callId: string): Promise<boolean>;
    hasActiveCalls(): Promise<boolean>;
    countTotal(): Promise<number>;
    countActive(): Promise<number>;
}
//# sourceMappingURL=ICallRepository.d.ts.map