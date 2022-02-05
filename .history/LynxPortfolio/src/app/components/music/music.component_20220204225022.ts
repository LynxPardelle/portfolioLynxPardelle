import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, Album, Song } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
  providers: [WebService, TranslateService],
})
export class MusicComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public albums: Album[] = [];
  public album: Album = new Album('', null, '', '', 0);
  public songs: Song[] = [];
  public song: Song = new Song('', null, 0, null, 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'music.component.ts';
  public customConsoleCSS =
    'background-color: rgba(50, 235, 100, 1); color: black; padding: 1em;';

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
        sharedContent.from !== 'music' &&
        (sharedContent.to === 'music' || sharedContent.to === 'all')
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
              this.document + ' 67',
              this.customConsoleCSS
            );
            break;
        }
      }
    });

    // Identity
    this.identity = this._mainService.getIdentity();
    this._webService.consoleLog(
      this.identity,
      this.document + ' 79',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'music',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'music',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from music',
    });

    // this.getAlbums();
  }

  async getAlbums() {
    try {
      let albums = await this._mainService.getAlbums().toPromise();

      if (!albums || !albums.albums) {
        throw new Error('There is no albums.');
      }

      this.albums = albums.albums;

      this._webService.consoleLog(
        this.albums,
        this.document + ' 113',
        this.customConsoleCSS
      );
    } catch (err) {
      this._webService.consoleLog(
        err,
        this.document + ' 119',
        this.customConsoleCSS
      );
    }
  }

}
