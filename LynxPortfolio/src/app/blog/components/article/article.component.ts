import { Component, OnInit } from '@angular/core';
/* RxJs */
import { Observable } from 'rxjs';
/* Interfaces */
import { IMain } from 'src/app/core/interfaces/main';
/* Services */
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { MainMainSelector } from 'src/app/state/selectors/main.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit {
  public main!: IMain;
  /* State */
  public main$: Observable<IMain | undefined>;
  constructor(private _befService: BefService, private store: Store<AppState>) {
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
  /* Utility */
  cssCreate() {
    this._befService.cssCreate();
  }
}
