import { Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpRequest,
  HttpHeaders,
  HttpResponse,
  HttpHeaderResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class BefService {

  constructor(
  ) {}

  // Pruebas
  pruebas() {
    return 'Soy el servicio de bef';
  }

}
