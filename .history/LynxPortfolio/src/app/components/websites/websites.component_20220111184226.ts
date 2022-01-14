import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, WebSite } from '../../models/main';

// Extras
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'websites',
  templateUrl: './websites.component.html',
  styleUrls: ['./websites.component.scss'],
  providers: [WebService, TranslateService],
})
export class WebsitesComponent implements OnInit {
  public identity: any;
  public main!: Main;
  public webSites: WebSite[] = [];
  public webSite: WebSite = new WebSite('', '', '', '', '', '', '', null, null, null, 0);

  // Translate
  public lang: string = 'es';

  // Urls
  public urlMain: string = GlobalMain.url;

  // Console Settings
  public document: string = 'demoreel.component.ts';
  public customConsoleCSS =
    'background-color: rgba(90, 170, 90, 0.75); color: black; padding: 1em;';

  // Utility
  public edit: boolean = false;
  constructor(
    private _mainService: MainService,

    private _webService: WebService,

    private _translate: TranslateService,
    private _location: Location,

    private _sharedService: SharedService
  ) { }

  ngOnInit(): void {
  }

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }

}
