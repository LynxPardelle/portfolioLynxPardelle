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

import { WebService } from './web.service';

@Injectable()
export class BefService {
  public colors: any = {};
  public colorsNames: string[] = [];
  public colorsDefault: any = {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    info: '#0dcaf0',
    warning: '#ffc107',
    danger: '#dc3545',
    light: '#f8f9fa',
    dark: '#212529',
  };
  public colorsBS: any = {
    indigo: '#6610f2',
    purple: '#6f42c1',
    pink: '#d63384',
    orange: '#fd7e14',
    teal: '#20c997',
    white: '#fff',
    gray: '#6c757d',
  };
  public colorsLP: any = {
    mystic: '#210020',
    lavender: '#D6BCFF',
    fairy: '#D680FF',
    summer: '#FF9A2E',
    old: '#EEEDA0',
    friend: '#3BBBB2',
    tree: '#5A311D',
    blood: '#8A0707',
    beast: '#F5785D',
    abyss: '#000',
  };

  constructor(
    private _webService: WebService,
  ) {
    this.pushColors(this.colorsDefault);
    this.pushColors(this.colorsBS);
    this.pushColors(this.colorsLP);
  }

  // Pruebas
  pruebas() {
    return 'Soy el servicio de bef';
  }

  async pushColors(newColors: any) {
    try {
      await Object.keys(newColors).forEach((key) => {
        this.colors[key] = newColors[key];
      });
      await Object.keys(this.colors).forEach((key) => {
        if (!this.colorsNames.includes(key)) {
          this.colorsNames.push(key);
        }
      });
    } catch (err) {
      this._webService.consoleLog(err);
    }
  }
}
