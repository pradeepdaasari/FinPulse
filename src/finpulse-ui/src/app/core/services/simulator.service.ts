import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WhatIfRequest, WhatIfResult } from '../models/simulator.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/simulator`;

  runWhatIf(request: WhatIfRequest): Observable<WhatIfResult> {
    return this.http.post<WhatIfResult>(`${this.baseUrl}/what-if`, request);
  }
}
