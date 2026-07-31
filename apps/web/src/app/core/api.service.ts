import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:3000/api';
const TOKEN_KEY = 'comal_token';
const USER_KEY = 'comal_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Kitchen {
  id: string;
  slug: string;
  name: string;
  description: string;
  addressLine: string;
  city: string;
  basePriceCents: number;
  basePriceEur: number;
  minHours: number;
  verified: boolean;
  ratingAvg: number;
  reviewCount: number;
  equipment: { code: string; labelEs: string }[];
  stations: {
    id: string;
    name: string;
    capacityNotes: string | null;
    isActive: boolean;
    priceCents: number;
    priceEur: number;
  }[];
  cancellationPolicy?: { description?: string };
}

export interface Booking {
  id: string;
  publicCode: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalEur: number;
  accessPin: string;
  kitchenName?: string;
  kitchenSlug?: string;
  stationName?: string;
  address?: string;
  priceBreakdown?: Record<string, unknown>;
  refundCents?: number;
  refundPct?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get user(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  private authHeaders(): HttpHeaders {
    const t = this.token;
    return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
  }

  private setSession(accessToken: string, user: User) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: User }>(`${API}/auth/login`, { email, password })
      .pipe(tap((r) => this.setSession(r.accessToken, r.user)));
  }

  register(body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
  }) {
    return this.http
      .post<{ accessToken: string; user: User }>(`${API}/auth/register`, body)
      .pipe(tap((r) => this.setSession(r.accessToken, r.user)));
  }

  me() {
    return this.http.get(`${API}/auth/me`, { headers: this.authHeaders() });
  }

  listKitchens(params?: {
    city?: string;
    equipment?: string;
    maxPrice?: number;
    q?: string;
  }): Observable<Kitchen[]> {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.equipment) qs.set('equipment', params.equipment);
    if (params?.maxPrice) qs.set('maxPrice', String(params.maxPrice));
    if (params?.q) qs.set('q', params.q);
    const q = qs.toString();
    return this.http.get<Kitchen[]>(`${API}/kitchens${q ? `?${q}` : ''}`);
  }

  getKitchen(slug: string): Observable<Kitchen> {
    return this.http.get<Kitchen>(`${API}/kitchens/${slug}`);
  }

  availability(stationId: string, date: string) {
    return this.http.get<{
      hours: { hour: number; status: 'free' | 'booked' | 'blocked' }[];
    }>(`${API}/bookings/availability?stationId=${stationId}&date=${date}`);
  }

  createBooking(stationId: string, startsAt: string, hours: number) {
    return this.http.post<Booking>(
      `${API}/bookings`,
      { stationId, startsAt, hours },
      { headers: this.authHeaders() },
    );
  }

  myBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API}/bookings`, {
      headers: this.authHeaders(),
    });
  }

  getBooking(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${API}/bookings/${id}`, {
      headers: this.authHeaders(),
    });
  }

  cancelBooking(id: string) {
    return this.http.post<Booking>(
      `${API}/bookings/${id}/cancel`,
      {},
      { headers: this.authHeaders() },
    );
  }

  checkIn(id: string) {
    return this.http.post<Booking>(
      `${API}/bookings/${id}/check-in`,
      {},
      { headers: this.authHeaders() },
    );
  }

  opsDashboard() {
    return this.http.get(`${API}/ops/dashboard`, {
      headers: this.authHeaders(),
    });
  }

  opsValidatePin(pin: string) {
    return this.http.post(
      `${API}/ops/check-in`,
      { pin },
      { headers: this.authHeaders() },
    );
  }
}
