import { Component, DoCheck, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from './services/global';
import { MainService } from './services/main.service';
import { WebService } from './services/web.service';
import { BefService } from './services/bef.service';
import { SharedService } from './services/shared.service';

// Models
import { Main, Song } from './models/main';

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
  public songs: Song[] = [];
  public currentSong: Song = new Song('', '', null, 0, null, '', 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'app.component.ts';
  public customConsoleCSS =
    'background-color: green; color: white; padding: 1em;';

  // BEF
  public colors: any = {
    fullRed: '#FF5555',
    midRed: '#DD5555',
    fullYellow: '#f9c24f',
    fullGreen: '#55FF55',
    facebook: '#0a58ca',
    whatsApp: '#48C02D',
    twitter: '#1C9BEA',
    gmail: '#CF4B3B',
    linkedIn: '#2465AA',
    udark: '#050505',
    tdark: '#000000',
    ulight: '#f5f5f5',
    tlight: '#ffffff',
    transparent: 'rgba(0,0,0,0)',
    trlight25: 'rgba($tlight, 0.25)',
    trlight5: 'rgba($tlight, 0.5)',
    fRed25: 'rgba($fullRed,0.25)',
    fRed5: 'rgba($fullRed,0.5)',
  };

  // Utility
  public windowWidth = window.innerWidth;
  public copiedToClipBoard: string = '';
  public currentAudio: any;
  constructor(
    private _mainService: MainService,

    private _webService: WebService,
    private _befService: BefService,

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
          case 'windowWidth':
            this.windowWidth = sharedContent.thing;
            break;
          case 'copiedToClipBoard':
            this.copiedToClipBoard = sharedContent.thing;
            break;
          case 'play':
            this.playAudio(sharedContent.thing);
            break;
          case 'pause':
            this.pause();
            break;
          case 'checkForCurrentSong':
            this.checkForCurrentSong();
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

    //BEF
    this._befService.pushColors(this.colors);

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
        this._befService.cssCreate();

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

    this.getSongs();

    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'lang',
      thing: this.lang,
    });
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth = event.target.innerWidth;
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'windowWidth',
      thing: this.windowWidth,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from app',
    });
    this._befService.cssCreate();
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
    this._befService.cssCreate();
  }

  async getSongs() {
    try {
      let songs = await this._mainService.getSongs().toPromise();

      if (!songs || !songs.songs) {
        throw new Error('There is no songs.');
      }

      this.songs = songs.songs;

      this.playAudio(this.songs[0]);
      this.pause();

      this._webService.consoleLog(
        this.songs,
        this.document + ' 142',
        this.customConsoleCSS
      );
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 148',
        this.customConsoleCSS
      );
    }
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

  copyToClipBoard(copyText: string) {
    navigator.clipboard.writeText(copyText);
    this.copiedToClipBoard = '';
    this.copiedToClipBoard = copyText;
    this._sharedService.emitChange({
      from: 'music',
      to: 'all',
      property: 'copiedToClipBoard',
      thing: this.copiedToClipBoard,
    });
  }

  playAudio(newSong: Song) {
    if (this.currentSong !== newSong) {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      this.currentSong = newSong;
      this._webService.consoleLog(
        this.currentSong,
        this.document + ' 148',
        this.customConsoleCSS
      );
      this._sharedService.emitChange({
        from: 'app',
        to: 'music',
        property: 'currentSong',
        thing: this.currentSong,
      });
      if (
        this.currentSong &&
        this.currentSong.song &&
        this.currentSong.song.location &&
        this.currentSong.song.location !== ''
      ) {
        this.currentAudio = new Audio(
          this.urlMain + 'get-file/' + this.currentSong.song.location
        );
        this.currentAudio.play();
        this._sharedService.emitChange({
          from: 'app',
          to: 'music',
          property: 'currentAudio',
          thing: this.currentAudio,
        });
        setTimeout(() => {
          this._befService.cssCreate();
        }, 0.05);
      } else {
        this.currentAudio = null;
        this._sharedService.emitChange({
          from: 'app',
          to: 'music',
          property: 'currentAudio',
          thing: this.currentAudio,
        });
      }
    } else {
      this.currentAudio.play();
      this._sharedService.emitChange({
        from: 'app',
        to: 'music',
        property: 'currentAudio',
        thing: this.currentAudio,
      });
    }
  }

  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this._sharedService.emitChange({
        from: 'app',
        to: 'music',
        property: 'currentAudio',
        thing: this.currentAudio,
      });
    }
  }

  checkForCurrentSong() {
    if (this.currentSong._id !== '') {
      this._sharedService.emitChange({
        from: 'app',
        to: 'music',
        property: 'currentSong',
        thing: this.currentSong,
      });
      this._sharedService.emitChange({
        from: 'app',
        to: 'music',
        property: 'currentAudio',
        thing: this.currentAudio,
      });
    }
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
