import { Component, OnInit } from '@angular/core';

/* Services */
import { WebService } from '../../services/web.service';

@Component({
  selector: 'app-music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss']
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
