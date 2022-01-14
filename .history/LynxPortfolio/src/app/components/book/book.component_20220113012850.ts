import { Component, OnInit, DoCheck, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, BookImg } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  providers: [WebService, TranslateService],
})
export class BookComponent implements OnInit, DoCheck {
  public imgs: any = [
    {
      width: 200,
      height: 200,
    },
    {
      width: 300,
      height: 200,
    },
    {
      width: 300,
      height: 300,
    },
    {
      width: 800,
      height: 200,
    },
    {
      width: 200,
      height: 300,
    },
    {
      width: 500,
      height: 200,
    },
    {
      width: 600,
      height: 400,
    },
    {
      width: 300,
      height: 500,
    },
    {
      width: 400,
      height: 200,
    },
    {
      width: 500,
      height: 400,
    },
    {
      width: 300,
      height: 600,
    },
  ];

  public identity: any;
  public main!: Main;
  public bookImgs: BookImg[] = [];
  public bookImg: BookImg = new BookImg(
    '',
    '',
    null,
    0,
  );

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'book.component.ts';
  public customConsoleCSS =
    'background-color: rgba(200, 35, 100, 1); color: black; padding: 1em;';

  // Utility
  public edit: boolean = false;
  public windowWidth = window.innerWidth;
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
        sharedContent.from !== 'book' &&
        (sharedContent.to === 'book' || sharedContent.to === 'all')
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
      from: 'book',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
  }

  ngDoCheck(): void {}
}
