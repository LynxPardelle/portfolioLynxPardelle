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
  public alreadyCreatedClasses: string[] = [];

  // Console Settings
  public document: string = 'demoreel.component.ts';
  public customConsoleCSS =
    'background-color: rgba(190, 170, 190, 0.75); color: black; padding: 1em;';


  constructor(private _webService: WebService) {
    this.pushColors(this.colorsDefault);
    this.pushColors(this.colorsBS);
    this.pushColors(this.colorsLP);
  }

  // Pruebas
  pruebas() {
    return 'Soy el servicio de bef';
  }

  cssCreate() {
    try {
      let sheets = [...document.styleSheets];
      let startTimeCSSCreate = performance.now();
      let befElements = document.getElementsByClassName('bef');
      let befs: string[] = [];
      for (let befElement of befElements) {
        befElement.classList.forEach((item) => {
          if (!befs.includes(item) && item !== 'bef' && item.includes('bef')) {
            befs.push(item);
          }
        });
      }
      let befsStringed = '';
      let befsStringedSM = '';
      let befsStringedMD = '';
      let befsStringedLG = '';
      let befsStringedXl = '';
      let befsStringedXXL = '';
      for (let bef of befs) {
        let befStringed = '.' + bef;
        if(this.alreadyCreatedClasses.includes(befStringed)){
          continue;
        }
        this.alreadyCreatedClasses.push(befStringed);
        if (
          sheets
            .map((s) =>
              [...s.cssRules]
                .reverse()
                .find((i) => i.cssText.includes(befStringed))
            )
            .filter((i) => i)
            .pop()
        ) {
          continue;
        }
        let befSplited = bef.split('-');
        let hasBP = false;
        let value = '';
        if (
          befSplited[2] === 'sm' ||
          befSplited[2] === 'md' ||
          befSplited[2] === 'lg' ||
          befSplited[2] === 'xl' ||
          befSplited[2] === 'xxl'
        ) {
          hasBP = true;
          value = befSplited[3];
        } else if (befSplited[2]) {
          value = befSplited[2];
        }
        value = value.replace(/per/g, '%');
        value = value.replace(/COM/g, ' , ');
        value = value.replace(/MIN/g, '-');
        value = value.replace(/SD/g, '(');
        value = value.replace(/ED/g, ')');
        value = value.replace(/HASH/g, '#');
        value = value.replace(/__/g, ' ');
        value = value.replace(/_/g, '.');
        switch (befSplited[1]) {
          case 'w':
            befStringed += `{width:${value};}`;
            break;
          case 'h':
            befStringed += `{height:${value};}`;
            break;
          case 'wmn':
            befStringed += `{min-width:${value};}`;
            break;
          case 'hmn':
            befStringed += `{min-height:${value};}`;
            break;
          case 'wmx':
            befStringed += `{max-width:${value};}`;
            break;
          case 'hmx':
            befStringed += `{max-height:${value};}`;
            break;
          case 'rounded':
            befStringed += `{border-radius:${value};}`;
            break;
          case 'z':
            befStringed += `{z-index:${value};}`;
            break;
          case 'opacity':
            befStringed += `{opacity:${value};}`;
            break;
            case "position":
          let positionOptions = [
            "static",
            "absolute",
            "fixed",
            "relative",
            "sticky",
            "initial",
            "inherit",
          ];
          if (positionOptions.includes(value)) {
            befStringed += `{position:${value};}`;
          } else {
            befStringed += `{position:static;}`;
          }
          break;
          case 'top':
            befStringed += `{top:${value};}`;
            break;
          case 'bot':
            befStringed += `{bottom:${value};}`;
            break;
          case 'end':
            befStringed += `{right:${value};}`;
            break;
          case 'start':
            befStringed += `{left:${value};}`;
            break;
          case 'fs':
            befStringed += `{font-size:${value};}`;
            break;
          case 'lh':
            befStringed += `{line-height:${value};}`;
            break;
          case 'gap':
            befStringed += `{gap:${value};}`;
            break;
            case "rowGap":
          befStringed += `{row-gap:${value};}`;
          break;
        case "columnGap":
          befStringed += `{column-gap:${value};}`;
          break;
          case 'p':
            befStringed += `{padding:${value};}`;
            break;
          case 'pt':
            befStringed += `{padding-top:${value};}`;
            break;
          case 'pb':
            befStringed += `{padding-bottom:${value};}`;
            break;
          case 'ps':
            befStringed += `{padding-left:${value};}`;
            break;
          case 'pe':
            befStringed += `{padding-right:${value};}`;
            break;
          case 'px':
            befStringed += `{padding-left:${value};padding-right:${value};}`;
            break;
          case 'py':
            befStringed += `{padding-top:${value};padding-bottom:${value};}`;
            break;
          case 'm':
            befStringed += `{margin:${value};}`;
            break;
          case 'mt':
            befStringed += `{margin-top:${value};}`;
            break;
          case 'mb':
            befStringed += `{margin-bottom:${value};}`;
            break;
          case 'ms':
            befStringed += `{margin-left:${value};}`;
            break;
          case 'me':
            befStringed += `{margin-right:${value};}`;
            break;
          case 'mx':
            befStringed += `{margin-left:${value};margin-right:${value};}`;
            break;
          case 'my':
            befStringed += `{margin-top:${value};margin-bottom:${value};}`;
            break;
          case 'border':
            befStringed += `{border-width:${value};}`;
            break;
          case 'bordert':
            befStringed += `{border-top-width:${value};}`;
            break;
          case 'borderb':
            befStringed += `{border-bottom-width:${value};}`;
            break;
          case 'borders':
            befStringed += `{border-left-width:${value};}`;
            break;
          case 'bordere':
            befStringed += `{border-right-width:${value};}`;
            break;
          case 'borderx':
            befStringed += `{border-right-width:${value};border-left-width:${value};}`;
            break;
          case 'bordery':
            befStringed += `{border-top-width:${value};border-bottom-width:${value};}`;
            break;
          case 'borderStyle':
            befStringed += `{border-style:${value};}`;
            break;
          case 'borderStylet':
            befStringed += `{border-top-style:${value};}`;
            break;
          case 'borderStyleb':
            befStringed += `{border-bottom-style:${value};}`;
            break;
          case 'borderStyles':
            befStringed += `{border-left-style:${value};}`;
            break;
          case 'borderStylee':
            befStringed += `{border-right-style:${value};}`;
            break;
          case 'borderStylex':
            befStringed += `{border-right-style:${value};border-left-style:${value};}`;
            break;
          case 'borderStyley':
            befStringed += `{border-top-style:${value};border-bottom-style:${value};}`;
            break;
        }
        if (
          (befSplited[1] === 'bg' ||
            befSplited[1] === 'bgHover' ||
            befSplited[1] === 'bgActive' ||
            befSplited[1] === 'text' ||
            befSplited[1] === 'textHover' ||
            befSplited[1] === 'textActive' ||
            befSplited[1] === 'link' ||
            befSplited[1] === 'linkHover' ||
            befSplited[1] === 'linkActive' ||
            befSplited[1] === 'borderColor' ||
            befSplited[1] === 'borderColort' ||
            befSplited[1] === 'borderColorb' ||
            befSplited[1] === 'borderColors' ||
            befSplited[1] === 'borderColore' ||
            befSplited[1] === 'borderColorx' ||
            befSplited[1] === 'borderColory' ||
            befSplited[1] === 'btn' ||
            befSplited[1] === 'btnOutline' ||
            befSplited[1] === 'boxShadow' ||
            befSplited[1] === 'textShadow') &&
          (this.colorsNames.includes(value) ||
            (this.colorsNames.includes(value.split(' ')[0]) &&
              this.colorsNames.includes(value.split(' ')[0])) ||
            (this.colorsNames.includes(value.split(' ')[1]) &&
              this.colorsNames.includes(value.split(' ')[1])) ||
            (this.colorsNames.includes(value.split(' ')[2]) &&
              this.colorsNames.includes(value.split(' ')[2])) ||
            (this.colorsNames.includes(value.split(' ')[3]) &&
              this.colorsNames.includes(value.split(' ')[3])) ||
            (this.colorsNames.includes(value.split(' ')[4]) &&
              this.colorsNames.includes(value.split(' ')[4])))
        ) {
          switch (befSplited[1]) {
            case 'bg':
              if (value.includes(' OPA')) {
                befStringed += `{background-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{background-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'bgHover':
              if (value.includes(' OPA')) {
                befStringed += `:hover{background-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `:hover{background-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'bgActive':
              if (value.includes(' OPA')) {
                befStringed += `:active{background-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `:active{background-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'text':
              if (value.includes(' OPA')) {
                befStringed += `{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'textHover':
              if (value.includes(' OPA')) {
                befStringed += `:hover{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `:hover{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'textActive':
              if (value.includes(' OPA')) {
                befStringed += `:active{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `:active{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'link':
              if (value.includes(' OPA')) {
                befStringed = `.${bef} a{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed = `.${bef} a{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'linkHover':
              if (value.includes(' OPA')) {
                befStringed = `.${bef} a:hover{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed = `.${bef} a:hover{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'linkActive':
              if (value.includes(' OPA')) {
                befStringed = `.${bef} a:active{color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed = `.${bef} a:active{color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColor':
              if (value.includes(' OPA')) {
                befStringed += `{border-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColort':
              if (value.includes(' OPA')) {
                befStringed += `{border-top-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-top-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColorb':
              if (value.includes(' OPA')) {
                befStringed += `{border-bottom-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-bottom-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColors':
              if (value.includes(' OPA')) {
                befStringed += `{border-right-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-right-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColore':
              if (value.includes(' OPA')) {
                befStringed += `{border-left-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-left-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColorx':
              if (value.includes(' OPA')) {
                befStringed += `{border-right-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${
                  value.split(' ')[2]
                }) !important;border-left-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-right-color:${this.colors[value]} !important;border-left-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'borderColory':
              if (value.includes(' OPA')) {
                befStringed += `{border-top-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${
                  value.split(' ')[2]
                }) !important;border-bottom-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]}) !important;}`;
              } else {
                befStringed += `{border-top-color:${this.colors[value]} !important;border-bottom-color:${this.colors[value]} !important;}`;
              }
              break;
            case 'btn':
              if (value.includes(' OPA')) {
                befStringed += `{
                  background-color: rgba(${this.HexToRGB(
                    this.colors[value.split(' ')[0]]
                  ).toString()}, ${value.split(' ')[2]});
                border-color: rgba(${this.HexToRGB(
                  this.colors[value.split(' ')[0]]
                ).toString()}, ${value.split(' ')[2]});}
                /.${bef}:hover{
                  background-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -15
                    )
                  ).toString()}, ${value.split(' ')[2]});
                border-color: rgba(${this.HexToRGB(
                  this.shadeTintColor(
                    this.HexToRGB(this.colors[value.split(' ')[0]]),
                    -20
                  )
                ).toString()}, ${value.split(' ')[2]});}
                /.btn-check:focus + .${bef}, .${bef}:focus{
                  background-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -15
                    )
                  ).toString()}, ${value.split(' ')[2]});
                border-color: rgba(${this.HexToRGB(
                  this.shadeTintColor(
                    this.HexToRGB(this.colors[value.split(' ')[0]]),
                    -20
                  )
                ).toString()}, ${value.split(' ')[2]});}
                /.btn-check:checked + .${bef}, .btn-check:active + .${bef}, .${bef}:active, .${bef}.active, .show > .${bef}.dropdown-toggle{
                  background-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -20
                    )
                  ).toString()}, ${value.split(' ')[2]});
                border-color: rgba(${this.HexToRGB(
                  this.shadeTintColor(
                    this.HexToRGB(this.colors[value.split(' ')[0]]),
                    -25
                  )
                ).toString()}, ${value.split(' ')[2]});
                box-shadow: 0 0 0 0.25rem
                rgba(${this.HexToRGB(
                  this.shadeTintColor(
                    this.HexToRGB(this.colors[value.split(' ')[0]]),
                    3
                  )
                )}, ${value.split(' ')[2]})
                ;}
                /.btn-check:checked + .btn-check:focus, .btn-check:active + .${bef}:focus, .${bef}:active:focus, .${bef}.active:focus, .show > .${bef}.dropdown-toggle:focus{
                  box-shadow: 0 0 0 0.25rem
                  rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      3
                    )
                  )}, ${value.split(' ')[2]})
                ;}`;
              } else {
                befStringed += `{
                  background-color:${this.colors[value]};
                  border-color:${this.colors[value]};}
                /.${bef}:hover{background-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -15
                )};border-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -20
                )};}
                /.btn-check:focus + .${bef}, .${bef}:focus{background-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -15
                )};border-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -20
                )};}
                /.btn-check:checked + .${bef}, .btn-check:active + .${bef}, .${bef}:active, .${bef}.active, .show > .${bef}.dropdown-toggle{background-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -20
                )};border-color:${this.shadeTintColor(
                  this.HexToRGB(this.colors[value]),
                  -25
                )};box-shadow: 0 0 0 0.25rem
                rgba(${this.HexToRGB(
                  this.shadeTintColor(this.HexToRGB(this.colors[value]), 3)
                )}, 0.5)
                ;}
                /.btn-check:checked + .btn-check:focus, .btn-check:active + .${bef}:focus, .${bef}:active:focus, .${bef}.active:focus, .show > .${bef}.dropdown-toggle:focus{box-shadow: 0 0 0 0.25rem
                  rgba(${this.HexToRGB(
                    this.shadeTintColor(this.HexToRGB(this.colors[value]), 3)
                  )}, 0.5)
                ;}`;
              }
              break;
            case 'btnOutline':
              if (value.includes(' OPA')) {
                befStringed += `{
                  color: rgba(${this.HexToRGB(
                    this.colors[value.split(' ')[0]]
                  ).toString()}, ${value.split(' ')[2]});
                  border-color: rgba(${this.HexToRGB(
                    this.colors[value.split(' ')[0]]
                  ).toString()}, ${value.split(' ')[2]});}
                  /.${bef}:hover{
                    background-color: rgba(${this.HexToRGB(
                      this.colors[value.split(' ')[0]]
                    ).toString()}, ${value.split(' ')[2]});
                  border-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -20
                    )
                  ).toString()}, ${value.split(' ')[2]});}
                  /.btn-check:focus + .${bef}, .${bef}:focus{
                  border-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -20
                    )
                  ).toString()}, ${value.split(' ')[2]});}
                  /.btn-check:checked + .${bef}, .btn-check:active + .${bef}, .${bef}:active, .${bef}.active, .show > .${bef}.dropdown-toggle{
                  border-color: rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      -25
                    )
                  ).toString()}, ${value.split(' ')[2]});
                  box-shadow: 0 0 0 0.25rem
                  rgba(${this.HexToRGB(
                    this.shadeTintColor(
                      this.HexToRGB(this.colors[value.split(' ')[0]]),
                      3
                    )
                  )}, ${value.split(' ')[2]})
                  ;}
                  /.btn-check:checked + .btn-check:focus, .btn-check:active + .${bef}:focus, .${bef}:active:focus, .${bef}.active:focus, .show > .${bef}.dropdown-toggle:focus{
                    box-shadow: 0 0 0 0.25rem
                    rgba(${this.HexToRGB(
                      this.shadeTintColor(
                        this.HexToRGB(this.colors[value.split(' ')[0]]),
                        3
                      )
                    )}, ${value.split(' ')[2]})
                  ;}`;
              } else {
                befStringed += `{
                  color:${this.colors[value]};
                    border-color:${this.colors[value]};}
                  /.${bef}:hover{
                    background-color:${this.colors[value]};
                    border-color:${this.shadeTintColor(
                      this.HexToRGB(this.colors[value]),
                      -20
                    )};}
                  /.btn-check:focus + .${bef}, .${bef}:focus{
                    border-color:${this.shadeTintColor(
                      this.HexToRGB(this.colors[value]),
                      -20
                    )};}
                  /.btn-check:checked + .${bef}, .btn-check:active + .${bef}, .${bef}:active, .${bef}.active, .show > .${bef}.dropdown-toggle{
                    border-color:${this.shadeTintColor(
                      this.HexToRGB(this.colors[value]),
                      -25
                    )};
                  box-shadow: 0 0 0 0.25rem
                  rgba(${this.HexToRGB(
                    this.shadeTintColor(this.HexToRGB(this.colors[value]), 3)
                  )}, 0.5)
                  ;}
                  /.btn-check:checked + .btn-check:focus, .btn-check:active + .${bef}:focus, .${bef}:active:focus, .${bef}.active:focus, .show > .${bef}.dropdown-toggle:focus{
                    box-shadow: 0 0 0 0.25rem
                    rgba(${this.HexToRGB(
                      this.shadeTintColor(this.HexToRGB(this.colors[value]), 3)
                    )}, 0.5)
                  ;}`;
              }
              break;
            case 'boxShadow':
              for (let splitVal of value.split(' ')) {
                if (this.colorsNames.includes(splitVal)) {
                  value = value.replace(splitVal, this.colors[splitVal]);
                }
              }
              befStringed += `{box-shadow:${value} !important;}`;
              break;
            case 'textShadow':
              for (let splitVal of value.split(' ')) {
                if (this.colorsNames.includes(splitVal)) {
                  value = value.replace(splitVal, this.colors[splitVal]);
                }
              }
              befStringed += `{text-shadow:${value} !important;}`;
              break;
          }
        }
        for (let cssProperty of befStringed.split(";")) {
          if (
            !cssProperty.includes("!important") &&
            cssProperty.length > 5
          ) {
            befStringed = befStringed.replace(
              cssProperty,
              cssProperty + " !important"
            );
          }
        }
        if (befStringed.includes('{') && befStringed.includes('}')) {
          if (hasBP === true) {
            befStringed = befStringed.replace(/\//g, '');
            switch (befSplited[2]) {
              case 'sm':
                befsStringedSM += befStringed;
                break;
              case 'md':
                befsStringedMD += befStringed;
                break;
              case 'lg':
                befsStringedLG += befStringed;
                break;
              case 'xl':
                befsStringedXl += befStringed;
                break;
              case 'xxl':
                befsStringedXXL += befStringed;
                break;
            }
          } else {
            befsStringed += befStringed + '/';
          }
        }
      }
      if (befsStringed !== '') {
        for (let bef of befsStringed.split('/')) {
          if (bef !== '') {
            this.createCSSRules(bef);
          }
        }
      }
      if (befsStringedSM !== '') {
        this.createCSSRules(
          `@media only screen and (min-width: 576px) {${befsStringedSM}}`
        );
      }
      if (befsStringedMD !== '') {
        this.createCSSRules(
          `@media only screen and (min-width: 768px) {${befsStringedMD}}`
        );
      }
      if (befsStringedLG !== '') {
        this.createCSSRules(
          `@media only screen and (min-width: 992px) {${befsStringedLG}}`
        );
      }
      if (befsStringedXl !== '') {
        this.createCSSRules(
          `@media only screen and (min-width: 1200px) {${befsStringedXl}}`
        );
      }
      if (befsStringedXXL !== '') {
        this.createCSSRules(
          `@media only screen and (min-width: 1400px) {${befsStringedXXL}}`
        );
      }
      var endTimeCSSCreate = performance.now();
      /* this._webService.consoleLog(
        `Call to cssCreate() took ${
          endTimeCSSCreate - startTimeCSSCreate
        } milliseconds`,
        this.document + ' 710',
        this.customConsoleCSS
      ); */
      let befTimer = document.getElementById('befTimer');
      if (befTimer) {
        befTimer.innerHTML = `
        <p>
        Call to cssCreate() took ${
          endTimeCSSCreate - startTimeCSSCreate
        } milliseconds
        </p>
        `;
      }
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 728',
        this.customConsoleCSS
      );
    }
  }

  createCSSRules(rule: string) {
    try {
      let sheets: any[] = [...document.styleSheets];
      let sheet: any;
      if (sheets[sheets.length - 1]) {
        sheet = sheets[sheets.length - 1];
      } else {
        sheet = sheets.pop();
      }
      let ruleI;
      ruleI = rule;
      let selector: string = '';
      let props: string = '';
      let propsArr: any = [];
      let ruleOriginal: any = '';
      if (ruleI && !ruleI.split('{')[0].includes('@media')) {
        selector = ruleI.split('{')[0];
        // CSS (& HTML) reduce spaces in selector to one.
        selector = selector.replace('\n', '').replace(/\s+/g, ' ');
        let findRule = (s: any) =>
          [...s.cssRules].reverse().find((i) => i.cssText.includes(selector));
        ruleOriginal = sheets
          .map(findRule)
          .filter((i) => i)
          .pop();

        props = ruleI.split('{')[1].split('}')[0];
        props = props.trim();
        if (props.lastIndexOf(';') === props.length - 1) {
          props = props.substring(0, props.length - 1);
        }
        if (props.includes('\n')) {
          let propsN = '';
          props.split('\n').forEach((prop) => {
            prop = prop.trim();
            propsN += ' ' + prop;
          });
          props = propsN.trim();
        }
        propsArr = props.split(/\s*;\s*/).map((i) => i.split(/\s*:\s*/)); // from string // from Object
      } else {
        let i = 0;
        let newRule: any = {
          rule: '',
          prop: '',
        };
        for (let ruleISplit of ruleI.split('{')) {
          if (i === 0) {
            ruleOriginal = [];
            i++;
            continue;
          }
          selector = ruleISplit.includes('}')
            ? ruleISplit.split('}')[ruleISplit.split('}').length - 1]
            : ruleISplit;
          // CSS (& HTML) reduce spaces in selector to one.
          if (selector !== '') {
            selector = selector.replace('\n', '').replace(/\s+/g, ' ');
            let findRule = (s: any) =>
              [...s.cssRules]
                .reverse()
                .find((i) => i.cssText.includes(selector));
            let posibleRule = sheets
              .map(findRule)
              .filter((i) => i)
              .pop();

            if (posibleRule != undefined) {
              newRule.rule = posibleRule;
            }
          } else {
            props = ruleISplit.includes('}')
              ? ruleISplit.split('}')[0]
              : ruleISplit;

            // CSS (& HTML) reduce spaces in selector to one.
            if (props !== '') {
              props = props.replace('\n', '').replace(/\s+/g, ' ');
              if (props.lastIndexOf(';') === props.length - 1) {
                props = props.substring(0, props.length - 1);
              }
              if (props.includes('\n')) {
                let propsN = '';
                props.split('\n').forEach((prop) => {
                  prop = prop.trim();
                  propsN += ' ' + prop;
                });
                props = propsN.trim();
              }

              let propArr = props
                .split(/\s*;\s*/)
                .map((i) => i.split(/\s*:\s*/)); // from string
              if (newRule.rule != '') {
                newRule.prop = propArr;
                ruleOriginal.push(newRule);
                newRule = {
                  rule: '',
                  prop: '',
                };
              }
            }
          }
        }
      }
      if (
        (typeof ruleOriginal === 'string' && ruleOriginal !== '') ||
        (typeof ruleOriginal === 'object' && ruleOriginal[0])
      ) {
        if (ruleOriginal[0]) {
          for (let ruleO of ruleOriginal) {
            for (let [prop, val] of ruleO.prop) {
              prop = prop
                .replace(/-(.)/g, (a: any) => {
                  return a.toUpperCase();
                })
                .replace(/-/g, '');
              ruleO.rule.cssRules[0].style[prop] =
                val.split(/ *!(?=important)/);
            }
          }
        } else {
          for (let [prop, val] of propsArr) {
            prop = prop
              .replace(/-(.)/g, (a: any) => {
                return a.toUpperCase();
              })
              .replace(/-/g, '');
            ruleOriginal.style[prop] = val.split(/ *!(?=important)/);
          }
        }
      } else {
        if (sheet) {
          sheet.insertRule(ruleI, sheet.cssRules.length);
        }
      }
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 873',
        this.customConsoleCSS
      );
    }
  }

  HexToRGB(Hex: string) {
    let rgb: number[];
    if (!Hex.includes('rgb') && !Hex.includes('rgba')) {
      let HexNoCat = Hex.replace('#', '');
      rgb =
        HexNoCat.length !== 3 && HexNoCat.length === 8
          ? [
              parseInt(HexNoCat.substr(0, 2), 16),
              parseInt(HexNoCat.substr(2, 2), 16),
              parseInt(HexNoCat.substr(4, 2), 16),
              parseInt(((HexNoCat.substr(6, 2), 16) / 255).toFixed(2)),
            ]
          : HexNoCat.length !== 3 && HexNoCat.length === 6
          ? [
              parseInt(HexNoCat.substr(0, 2), 16),
              parseInt(HexNoCat.substr(2, 2), 16),
              parseInt(HexNoCat.substr(4, 2), 16),
            ]
          : HexNoCat.length !== 3 && HexNoCat.length === 4
          ? [
              parseInt(HexNoCat.substr(0, 2), 16),
              parseInt(HexNoCat.substr(1, 2), 16),
              parseInt(HexNoCat.substr(2, 2), 16),
              parseInt(((HexNoCat.substr(3, 2), 16) / 255).toFixed(2)),
            ]
          : [
              parseInt(HexNoCat.substr(0, 1) + HexNoCat.substr(0, 1), 16),
              parseInt(HexNoCat.substr(1, 1) + HexNoCat.substr(1, 1), 16),
              parseInt(HexNoCat.substr(2, 1) + HexNoCat.substr(2, 1), 16),
            ];
    } else {
      rgb = Hex.split('(')[1].split(',')[4]
        ? [
            parseInt(Hex.split('(')[1].split(',')[0]),
            parseInt(Hex.split('(')[1].split(',')[1]),
            parseInt(Hex.split('(')[1].split(',')[2]),
            parseInt(Hex.split('(')[1].split(',')[3]),
          ]
        : [
            parseInt(Hex.split('(')[1].split(',')[0]),
            parseInt(Hex.split('(')[1].split(',')[1]),
            parseInt(Hex.split('(')[1].split(',')[2]),
          ];
    }
    return rgb;
  }

  shadeTintColor(rgb: number[], percent: number) {
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
    var A: any = rgb[3] ? (rgb[3] * 255).toString(16) : 'FF';
    R = parseInt(((R * (100 + percent)) / 100).toString());
    G = parseInt(((G * (100 + percent)) / 100).toString());
    B = parseInt(((B * (100 + percent)) / 100).toString());
    R = R > 255 ? 255 : R < 0 ? 0 : R;
    G = G > 255 ? 255 : G < 0 ? 0 : G;
    B = B > 255 ? 255 : B < 0 ? 0 : B;
    var RR = R.toString(16).length == 1 ? '0' + R.toString(16) : R.toString(16);
    var GG = G.toString(16).length == 1 ? '0' + G.toString(16) : G.toString(16);
    var BB = B.toString(16).length == 1 ? '0' + B.toString(16) : B.toString(16);
    var AA = A.toString(16).length == 1 ? '0' + A.toString(16) : A.toString(16);
    return '#' + RR + GG + BB + AA;
  }

  pushColors(newColors: any) {
    try {
      Object.keys(newColors).forEach((key) => {
        this.colors[key] = newColors[key].replace(
          '!important' || '!default' || /\s+/g,
          ''
        );
      });
      Object.keys(this.colors).forEach((key) => {
        if (!this.colorsNames.includes(key)) {
          this.colorsNames.push(key);
        }
      });
    } catch (err) {
      this._webService.consoleLog(err);
    }
  }
}
