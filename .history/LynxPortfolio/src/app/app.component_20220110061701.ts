import { Component, DoCheck, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from './services/global';
import { MainService } from './services/main.service';
import { WebService } from './services/web.service';
import { BefService } from './services/bef.service';
import { SharedService } from './services/shared.service';

// Models
import { Main } from './models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';

// NGX-Bootstrap
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    WebService,
    TranslateService,
    {
      provide: BsDropdownConfig,
      useValue: { isAnimated: true, autoClose: true },
    },
  ],
})
export class AppComponent implements OnInit, DoCheck {
  public identity: any;
  public main!: Main;

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'app.component.ts';
  public customConsoleCSS =
    'background-color: green; color: white; padding: 1em;';

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
        sharedContent.from !== 'app' &&
        (sharedContent.to === 'app' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'main':
            this.main = sharedContent.thing;
            break;
          case 'lang':
            this.lang = sharedContent.thing;
            break;
          case 'identity':
            this.identity = sharedContent.thing;
            break;
          case 'onlyConsoleMessage':
            this._webService.consoleLog(
              sharedContent.thing,
              this.document + ' 45',
              this.customConsoleCSS
            );
            break;
        }
      }
    });

    this._translate.addLangs(['es', 'en']);
    this._translate.setDefaultLang(this.lang);
    this.lang =
      this._translate.getBrowserLang() &&
      this._translate.getBrowserLang() !== undefined &&
      this._translate.getBrowserLang()!.match(/en|es/)
        ? this._translate.getBrowserLang()!
        : this.lang;

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

    (async () => {
      try {
        let main = await this._mainService.getMain().toPromise();

        if (!main || !main.main) {
          throw new Error('No se pudo generar main.');
        }

        this.main = main.main;

        this._webService.consoleLog(
          this.main,
          this.document + ' 76',
          this.customConsoleCSS
        );

        this._sharedService.emitChange({
          from: 'app',
          to: 'all',
          property: 'main',
          thing: this.main,
        });
      } catch (err: any) {
        this._webService.consoleLog(
          err,
          this.document + ' 82',
          this.customConsoleCSS
        );
      }
    })();

    let lang = localStorage.getItem('lang');
    this.lang = lang !== null && typeof lang === 'string' ? lang : this.lang;
    this._translate.use(this.lang);

    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'lang',
      thing: this.lang,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from app',
    });
  }

  ngDoCheck(): void {
    this.identity = this._mainService.getIdentity();
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'main',
      thing: this.main,
    });

    let lang = localStorage.getItem('lang');
    this.lang = lang !== null && typeof lang === 'string' ? lang : this.lang;
    this._translate.use(this.lang);

    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'lang',
      thing: this.lang,
    });
  }

  async testing() {
    try {
    } catch (e: any) {}
  }

  changeLang(lang: string) {
    this.lang = lang;
    this._translate.use(lang);
    localStorage.setItem('lang', this.lang);
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'lang',
      thing: this.lang,
    });
  }

  logout() {
    localStorage.removeItem('identity');
    localStorage.removeItem('token');
    this.identity = null;
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
    window.location.reload();
  }

  backClicked() {
    this._location.back();
  }
}
