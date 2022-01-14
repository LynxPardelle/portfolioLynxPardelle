import { Component, DoCheck, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../../services/global';
import { MainService } from '../../../services/main.service';
import { WebService } from '../../../services/web.service';
import { SharedService } from '../../../services/shared.service';

// Models
import { Main } from '../../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  providers: [WebService, TranslateService],
})
export class InicioComponent implements OnInit, DoCheck {
  public identity: any;
  public main!: Main;

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'inicio.component.ts';
  public customConsoleCSS =
    'background-color: rgba(24, 54, 100, 0.75); color: white; padding: 1em;';

  // Utility
  public edit: boolean = false;
  constructor(
    private _mainService: MainService,

    private _webService: WebService,

    private _translate: TranslateService,
    private _location: Location,

    private _sharedService: SharedService
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'inicio' &&
        (sharedContent.to === 'inicio' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'main':
            this.main = sharedContent.thing;
            break;
          case 'lang':
            this.lang = sharedContent.thing;
            break;
          case 'onlyConsoleMessage':
            this._webService.consoleLog(
              sharedContent.thing,
              this.document + ' 45',
              this.customConsoleCSS
            );
            break;
          case 'identity':
            this.identity = sharedContent.thing;
            break;
        }
      }
    });

    // Identity
    this.identity = this._mainService.getIdentity();
    this._webService.consoleLog(
      this.identity,
      this.document + ' 60',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'inicio',
      thing: 'Data from inicio',
    });
  }

  ngDoCheck(): void {}

  async onSubmit(){
    var nEror = 500;
    try {

    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 107',
        this.customConsoleCSS
      );
    }
  }

  // Utility
  editChange() {
    this.edit =
      this.identity && this.identity.role && this.identity.role === 'ROLE_ADMIN'
        ? !this.edit
        : false;
  }

  Linkify(
    text: string,
    textcolor: string = '#ffffff',
    linkcolor: string = '#f9c24f'
  ) {
    let value: any;
    value = {
      text: '',
      matches: [],
    };

    value = this._webService.Linkify(text, textcolor, linkcolor);

    if (value.text) {
      this._webService.consoleLog(
        value.matches,
        this.document + ' 105',
        this.customConsoleCSS
      );
      return value.text;
    } else {
      return text;
    }
  }

  // Complex functions
  valuefy(text: string) {
    let matches = text.match(
      /{{+[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-.]{2,256}[\S]}}/gi
    );

    if (matches) {
      let i = 0;
      let match: any;
      for (match of matches) {
        let oldMatch = match;
        match = match.replace('{{', '');
        match = match.replace('}}', '');

        if (!match.includes('this.')) {
          match = 'this.' + match;
        }

        let nmatches = match.match(
          /this.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-]{2,256}.[-a-zA-Z0-9\[\]\(\)\"\'\<\>\=\+\-]{2,256}/gi
        );

        if (nmatches) {
          match = match.split('.');

          let i = 0;
          let nmatch: any = '';
          let error: boolean = false;
          for (let m of match) {
            if (i === 0) {
              nmatch = m;
            } else {
              if (nmatch !== undefined) {
                let nmatchEval = nmatch + '.' + m;
                let matchEval = eval(nmatchEval);

                if (matchEval !== undefined) {
                  nmatch = nmatch + '.' + m;
                } else {
                  nmatch = undefined;
                  error = true;
                }
              }
            }
            i++;

            if (i >= match.length) {
              if (error === false) {
                let matchEval = eval(nmatch);

                if (matchEval !== undefined && matchEval !== null) {
                  text = text.replace(oldMatch, matchEval);
                } else {
                  text = text.replace(oldMatch, '');
                }
              } else {
                text = text.replace(oldMatch, '');
              }
            }
          }
        } else {
          let matchEval = eval(match);

          if (matchEval !== undefined && matchEval !== null) {
            text = text.replace(oldMatch, matchEval);
          } else {
            text = text.replace(oldMatch, '');
          }
        }

        i++;
      }

      return text;
    } else {
      return text;
    }
  }
}
