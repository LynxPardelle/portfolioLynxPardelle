import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';

// Services
import { GlobalMain } from '../../services/global';
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { Main, Album } from '../../models/main';

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

  constructor(
    private _webService: WebService,
  ) { }

  ngOnInit(): void {
  }

  checkWindowWidth(downUp: string, width: number) {
    return this._webService.checkWindowWidth(downUp, width);
  }

}
