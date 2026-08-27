import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TradingSetup, TradingSetupSummary, PreMarketNote, TradeEntry,
  TradingRule, DailyReview, DailyLimits, TradingStats, TradingWisdom,
  WisdomCategory, WeeklyFocus, WeeklySummary
} from '../models/trading.model';

@Injectable({ providedIn: 'root' })
export class TradingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/trading`;

  // --- Setups ---
  getSetups(): Observable<TradingSetupSummary[]> {
    return this.http.get<TradingSetupSummary[]>(`${this.baseUrl}/setups`);
  }

  getSetup(id: number): Observable<TradingSetup> {
    return this.http.get<TradingSetup>(`${this.baseUrl}/setups/${id}`);
  }

  createSetup(setup: Partial<TradingSetup>): Observable<TradingSetup> {
    return this.http.post<TradingSetup>(`${this.baseUrl}/setups`, setup);
  }

  updateSetup(id: number, setup: Partial<TradingSetup>): Observable<TradingSetup> {
    return this.http.put<TradingSetup>(`${this.baseUrl}/setups/${id}`, setup);
  }

  deleteSetup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/setups/${id}`);
  }

  // --- Pre-Market Notes ---
  getPreMarketNotes(fromDate?: string, toDate?: string): Observable<PreMarketNote[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<PreMarketNote[]>(`${this.baseUrl}/premarket`, { params });
  }

  getPreMarketNoteByDate(date: string): Observable<PreMarketNote> {
    return this.http.get<PreMarketNote>(`${this.baseUrl}/premarket/date/${date}`);
  }

  getTodayNote(): Observable<PreMarketNote> {
    return this.http.get<PreMarketNote>(`${this.baseUrl}/premarket/today`);
  }

  createPreMarketNote(note: Partial<PreMarketNote>): Observable<PreMarketNote> {
    return this.http.post<PreMarketNote>(`${this.baseUrl}/premarket`, note);
  }

  updatePreMarketNote(id: number, note: Partial<PreMarketNote>): Observable<PreMarketNote> {
    return this.http.put<PreMarketNote>(`${this.baseUrl}/premarket/${id}`, note);
  }

  // --- Trade Entries ---
  getTrades(fromDate?: string, toDate?: string): Observable<TradeEntry[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<TradeEntry[]>(`${this.baseUrl}/trades`, { params });
  }

  createTrade(trade: Partial<TradeEntry>): Observable<TradeEntry> {
    return this.http.post<TradeEntry>(`${this.baseUrl}/trades`, trade);
  }

  updateTrade(id: number, trade: Partial<TradeEntry>): Observable<TradeEntry> {
    return this.http.put<TradeEntry>(`${this.baseUrl}/trades/${id}`, trade);
  }

  deleteTrade(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/trades/${id}`);
  }

  getTradesByAccount(accountId: number): Observable<TradeEntry[]> {
    return this.http.get<TradeEntry[]>(`${this.baseUrl}/trades/by-account/${accountId}`);
  }

  // --- Rules ---
  getRules(): Observable<TradingRule[]> {
    return this.http.get<TradingRule[]>(`${this.baseUrl}/rules`);
  }

  createRule(rule: Partial<TradingRule>): Observable<TradingRule> {
    return this.http.post<TradingRule>(`${this.baseUrl}/rules`, rule);
  }

  updateRule(id: number, rule: Partial<TradingRule>): Observable<TradingRule> {
    return this.http.put<TradingRule>(`${this.baseUrl}/rules/${id}`, rule);
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rules/${id}`);
  }

  reorderRules(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/rules/reorder`, { ids });
  }

  // --- Daily Review ---
  getReviews(fromDate?: string, toDate?: string): Observable<DailyReview[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<DailyReview[]>(`${this.baseUrl}/reviews`, { params });
  }

  getTodayReview(): Observable<DailyReview> {
    return this.http.get<DailyReview>(`${this.baseUrl}/reviews/today`);
  }

  createReview(review: Partial<DailyReview>): Observable<DailyReview> {
    return this.http.post<DailyReview>(`${this.baseUrl}/reviews`, review);
  }

  updateReview(id: number, review: Partial<DailyReview>): Observable<DailyReview> {
    return this.http.put<DailyReview>(`${this.baseUrl}/reviews/${id}`, review);
  }

  // --- Limits ---
  getLimits(): Observable<DailyLimits> {
    return this.http.get<DailyLimits>(`${this.baseUrl}/limits`);
  }

  updateLimits(limits: Partial<DailyLimits>): Observable<DailyLimits> {
    return this.http.put<DailyLimits>(`${this.baseUrl}/limits`, limits);
  }

  // --- Stats ---
  getStats(days?: number): Observable<TradingStats> {
    let params = new HttpParams();
    if (days) params = params.set('days', days.toString());
    return this.http.get<TradingStats>(`${this.baseUrl}/stats`, { params });
  }

  getWeeklyFocus(): Observable<WeeklyFocus> {
    return this.http.get<WeeklyFocus>(`${this.baseUrl}/weekly-focus`);
  }

  // --- Weekly Summary ---
  getWeeklySummary(weekStart?: string): Observable<WeeklySummary> {
    let params = new HttpParams();
    if (weekStart) params = params.set('weekStart', weekStart);
    return this.http.get<WeeklySummary>(`${this.baseUrl}/weekly-summary`, { params });
  }

  getWeeklySummaries(count?: number): Observable<WeeklySummary[]> {
    let params = new HttpParams();
    if (count) params = params.set('count', count.toString());
    return this.http.get<WeeklySummary[]>(`${this.baseUrl}/weekly-summaries`, { params });
  }

  // --- Wisdom/Mentor ---
  getDailyWisdom(): Observable<TradingWisdom> {
    return this.http.get<TradingWisdom>(`${this.baseUrl}/wisdom/daily`);
  }

  getWisdomByCategory(category: WisdomCategory): Observable<TradingWisdom[]> {
    return this.http.get<TradingWisdom[]>(`${this.baseUrl}/wisdom`, { params: new HttpParams().set('category', category) });
  }
}
