import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
/* RxJs */
import { Observable } from 'rxjs';
/* Environment */
import { environment } from 'src/environments/environment';
/* Interfaces */
import { IArticle } from '../../interfaces/blog';
import { IMain } from 'src/app/core/interfaces/main';
/* Models */
import { Main } from 'src/app/core/models/main';
/* Services */
import { BlogService } from '../../services/blog.service';
import { MainService } from 'src/app/core/services/main.service';
import { WebService } from 'src/app/shared/services/web.service';
import { NgxBootstrapExpandedFeaturesService as BefService } from 'ngx-bootstrap-expanded-features';
import { SharedService } from 'src/app/shared/services/shared.service';
/* Extras */
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { MainMainSelector } from 'src/app/state/selectors/main.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';

@Component({
    selector: 'blog',
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.scss'],
    standalone: false
})
export class BlogComponent implements OnInit {
  public identity: any;
  public main!: Main;
  // Models
  public articles: IArticle[] = [];

  // Utility
  public page: number = 1;
  public next_page: number = 2;
  public prev_page: number = 1;
  public total: number = 0;
  public itemsPerPage: number = 5;

  public noMore: boolean = false;

  public search: string = '';

  public loading: boolean = true;
  /* Translate */
  public lang: string = 'es';

  /* Urls */
  public urlMain: string = environment.api + '/main/';

  /* Console Settings */
  public document: string = 'blog.component.ts';
  public customConsoleCSS =
    'background-color: rgba(75, 5, 200, 1); color: white; padding: 1em;';

  /* Utility */
  public edit: boolean = false;
  public windowWidth = window.innerWidth;
  /* State */
  public main$: Observable<IMain | undefined>;
  constructor(
    private _route: ActivatedRoute,
    private _mainService: MainService,

    private _webService: WebService,
    private _befService: BefService,
    private _blogService: BlogService,

    private _translate: TranslateService,
    private _location: Location,

    private _sharedService: SharedService,
    private store: Store<AppState>
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'blog' &&
        (sharedContent.to === 'blog' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
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
    this.main$ = store.select(MainMainSelector);

    /* Identity */
    this.identity = this._mainService.getIdentity();
    this._webService.consoleLog(
      this.identity,
      this.document + ' 79',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'blog',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
    this.store.dispatch(LoadMain());
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'blog',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from blog',
    });
    this.getMain();
    this.getBlog();
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

  getBlog() {
    this.articles = [];
    this.loading = true;
    /* Get page from url */
    this._route.params.subscribe({
      next: (params) => {
        this.page = params['page'] ? params['page'] : this.page;
        this.search = params['search']
          ? params['search']
          : params['cat']
          ? params['cat']
          : params['subcat']
          ? params['subcat']
          : this.search;
        this.next_page = this.page + 1;
        this.prev_page = this.page > 1 ? this.page - 1 : 1;
        this._blogService
          .getArticles(
            this.page,
            5,
            '_id',
            'all',
            'all',
            this.search || undefined
          )
          .subscribe({
            next: (b) => {
              this._webService.consoleLog(
                b,
                this.document + ' 114',
                this.customConsoleCSS
              );
              this.loading;
            },
            error: (e) => {
              this.loading = false;
              this._webService.consoleLog(
                e,
                this.document + ' 165',
                this.customConsoleCSS
              );
            },
          });
      },
      error: (e) => {
        this.loading = false;
        this._webService.consoleLog(
          e,
          this.document + ' 165',
          this.customConsoleCSS
        );
      },
    });
  }

  cssCreate() {
    this._befService.cssCreate();
  }
}
