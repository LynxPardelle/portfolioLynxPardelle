import { Component, OnInit } from '@angular/core';
/* RxJs */
import { Observable } from 'rxjs';
/* Interfaces */
import { IMain } from '../../interfaces/main';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { MainMainSelector } from 'src/app/state/selectors/main.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
/* State */

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
})
export class ErrorComponent implements OnInit {
  public main!: IMain;
  /* State */
  public main$: Observable<IMain | undefined>;

  constructor(
    private _befService: NgxBootstrapExpandedFeaturesService,
    private store: Store<AppState>
  ) {
    this.main$ = store.select(MainMainSelector);
    this.store.dispatch(LoadMain());
  }

  ngOnInit(): void {
    this.getMain();
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

  cssCreate() {
    this._befService.cssCreate();
  }
}
