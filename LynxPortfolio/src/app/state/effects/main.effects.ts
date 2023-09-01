import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/* RxJs */
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

/* Models */
import { Main } from 'src/app/core/models/main';

/* Store */
import * as MainActions from '../actions/main.actions';

/* Environment */
import { environment } from 'src/environments/environment';
@Injectable()
export class MainEffects {
  private readonly api = environment.api + '/main';

  LoadMainn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MainActions.LoadMain),
      mergeMap(() => {
        return this._http
          .get(`${this.api}/main`, {
            headers: new HttpHeaders({
              'content-type': 'application/json',
              encoding: 'UTF-8',
            }),
          })
          .pipe(
            map((r: any) => {
              if (r.main) {
                return MainActions.MainLoaded({
                  main: r.main,
                });
              } else {
                return MainActions.ErrorMain({ error: r });
              }
            }),
            catchError((e) => of(MainActions.ErrorMain({ error: e })))
          );
      })
    )
  );

  constructor(private actions$: Actions, private _http: HttpClient) {}
}
