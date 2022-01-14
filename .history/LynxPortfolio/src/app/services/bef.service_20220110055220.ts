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

  async HexToRGB(Hex: string) {
    let HexNoCat = Hex.replace("#", "");
    let rgb =
      HexNoCat.length !== 3
        ? [
            parseInt(HexNoCat.substr(0, 2), 16),
            parseInt(HexNoCat.substr(2, 2), 16),
            parseInt(HexNoCat.substr(4, 2), 16),
          ]
        : [
            parseInt(HexNoCat.substr(0, 1) + HexNoCat.substr(0, 1), 16),
            parseInt(HexNoCat.substr(1, 1) + HexNoCat.substr(1, 1), 16),
            parseInt(HexNoCat.substr(2, 1) + HexNoCat.substr(2, 1), 16),
          ];
    return rgb;
  }

  async shadeTintColor(rgb: number[], percent: number) {
    var R: any =
      rgb[0] === 0 && percent > 0
        ? 16
        : rgb[0] === 255 && percent < 0
        ? 239
        : rgb[0];
    var G: any =
      rgb[1] === 0 && percent > 0
        ? 16
        : rgb[1] === 255 && percent < 0
        ? 239
        : rgb[1];
    var B: any =
      rgb[2] === 0 && percent > 0
        ? 16
        : rgb[2] === 255 && percent < 0
        ? 239
        : rgb[2];
    R = parseInt(((R * (100 + percent)) / 100).toString());
    G = parseInt(((G * (100 + percent)) / 100).toString());
    B = parseInt(((B * (100 + percent)) / 100).toString());
    R = R > 255 ? 255 : R < 0 ? 0 : R;
    G = G > 255 ? 255 : G < 0 ? 0 : G;
    B = B > 255 ? 255 : B < 0 ? 0 : B;
    var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
    var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
    var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);
    return "#" + RR + GG + BB;
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
