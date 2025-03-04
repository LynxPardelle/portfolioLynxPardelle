import { Component, DoCheck, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';
/* Environment */
import { environment } from 'src/environments/environment';
/* Services */
import { MainService } from './core/services/main.service';
import { WebService } from './shared/services/web.service';
import { SharedService } from './shared/services/shared.service';
/* Models */
import { Main, Song } from './core/models/main';
/* Extras */
import { TranslateService } from '@ngx-translate/core';
/* NGX-Bootstrap */
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from './state/app.state';
import { MainMainSelector } from './state/selectors/main.selector';
import { LoadMain } from './state/actions/main.actions';
import { Observable } from 'rxjs';
import { IMain } from './core/interfaces/main';
import { IdentitySelector } from './state/selectors/sesion.selector';
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
    standalone: false
})
export class AppComponent implements OnInit, DoCheck {
  public identity: any;
  public main!: Main;
  public songs: Song[] = [];
  public currentSong: Song = new Song('', '', null, 0, null, '', 0);
  public bgDefaultClasses: string[] = [];
  /* Translate */
  public lang: string = 'es';
  /* Urls */
  public urlMain: string = environment.api + '/main/';
  /* Console Settings */
  public document: string = 'app.component.ts';
  public customConsoleCSS =
    'background-color: green; color: white; padding: 1em;';
  /* BEF */
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
  };
  /* Utility */
  public windowWidth = window.innerWidth;
  public copiedToClipBoard: string = '';
  public currentAudio: any;
  /* State */
  public main$: Observable<IMain | undefined>;
  public identity$: Observable<any | undefined>;
  constructor(
    private _mainService: MainService,
    private _webService: WebService,
    private _befService: BefService,
    private _translate: TranslateService,
    private _location: Location,
    private _sharedService: SharedService,
    private store: Store<AppState>
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent: any) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'app' &&
        (sharedContent.to === 'app' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'lang':
            this.lang = sharedContent.thing;
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
            /* this._webService.consoleLog(
              sharedContent.thing,
              this.document + ' 45',
              this.customConsoleCSS
            ); */
            break;
        }
      }
    });
    this.main$ = store.select(MainMainSelector);
    this.identity$ = store.select(IdentitySelector);

    this._translate.addLangs(['es', 'en']);
    this._translate.setDefaultLang(this.lang);
    this.lang =
      this._translate.getBrowserLang() &&
      this._translate.getBrowserLang() !== undefined &&
      this._translate.getBrowserLang()!.match(/en|es/)
        ? this._translate.getBrowserLang()!
        : this.lang;

    /* Identity */
    this.identity = this._mainService.getIdentity();
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });

    //BEF
    this._befService.pushColors(this.colors);

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
    this.store.dispatch(LoadMain());
  }
  /* addOpacityColors() {
    Object.keys(this.colors).forEach((key) => {
      if (key !== 'transparent' && !key.includes('rgba') && key.includes('#')) {
        Array.from({ length: 100 }, (v, i) => i).forEach((opacity) => {
          this.colors[
            key + opacity
          ] = `rgba(${this.colors[key]}, 0.${opacity})`;
        });
      }
    });
  } */
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
    this.getMain();
    this.getIdentity();
    this.bgDefaultClasses = [
      'position-fixed top-0 start-0 bef bef-w-100vw bef-h-100vh bef-z-MIN20 bef-backgroundColor-abyss bef-mixBlendMode-hue',
      'bef-backgroundImage-' +
        this.befysize(
          'url("' +
            environment.url +
            '/assets/images/image5DarkForest90deg.jpg")'
        ) +
        ' position-fixed top-0 start-0 bef bef-w-100vw bef-h-100vh bef-backgroundSize-cover bef-o-0_5 bef-mixBlendMode-lighten bef-z-MIN15 bef-backgroundPosition-center__center bef-backgroundRepeat-noMINrepeat',
      'bef-backgroundImage-' +
        this.befysize(
          'url("' +
            environment.url +
            '/assets/images/image5DarkForest90deg.jpg")'
        ) +
        ' position-fixed top-0 start-0 bef bef-w-100vw bef-h-100vh bef-backgroundSize-cover bef-o-0_5 bef-mixBlendMode-lighten bef-z-MIN10 bef-backgroundPosition-center__center bef-backgroundRepeat-noMINrepeat bef-transform-scaleXSDMIN1ED',
      'position-fixed top-0 start-0 bef bef-w-100vw bef-h-100vh bef-backgroundColor-HASHDD5555 bef-mixBlendMode-hue bef-z-MIN5',
    ];
    // this._befService.changeDebugOption();
    this.cssCreate();
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

  /* State */
  getMain() {
    this.main$.subscribe({
      next: (m) => {
        if (m !== undefined) {
          this.main = m;
          this.cssCreate();
        }
      },
      error: (e) => console.error(e),
    });
  }
  getIdentity() {
    this.identity$.subscribe({
      next: (i) => {
        if (i !== undefined) {
          this.identity = i;
        }
      },
      error: (e) => console.error(e),
    });
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
    } catch (err) {
      console.error(err);
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
    localStorage.removeItem('ILP');
    localStorage.removeItem('>');
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

  befysize(string: string) {
    return this._befService.befysize(string);
  }

  cssCreate() {
    this._befService.cssCreate();
  }
}
