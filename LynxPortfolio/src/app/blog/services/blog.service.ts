import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
/* RxJs */
import { Observable } from 'rxjs';
/* Environment */
import { environment } from 'src/environments/environment';
/* Services */
import { MainService } from 'src/app/core/services/main.service';
/* State */
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { IdentitySelector } from 'src/app/state/selectors/sesion.selector';
import { LoadMain } from 'src/app/state/actions/main.actions';
@Injectable({
  providedIn: 'root',
})
export class BlogService {
  public urlBlog: string = environment.api + '/article/';
  public identity: any;
  public token: any;
  /* State */
  public identity$: Observable<any | undefined>;
  constructor(
    private _http: HttpClient,
    private _mainService: MainService,
    private store: Store<AppState>
  ) {
    this.identity$ = store.select(IdentitySelector);
    this.store.dispatch(LoadMain());
    this.getIdentity();
  }
  /* State */
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
  /* Create */
  createArticle(article: any): Observable<any> {
    return this._http.post(`${this.urlBlog}article`, JSON.stringify(article));
  }
  createArticleSection(articleSection: any): Observable<any> {
    return this._http.post(
      `${this.urlBlog}articleSection`,
      JSON.stringify(articleSection)
    );
  }
  createArticleCat(articleCat: any): Observable<any> {
    return this._http.post(
      `${this.urlBlog}articleCat`,
      JSON.stringify(articleCat)
    );
  }
  createArticleSubCat(articleSubCat: any): Observable<any> {
    return this._http.post(
      `${this.urlBlog}articleSubCat`,
      JSON.stringify(articleSubCat)
    );
  }
  /* Read */
  getArticles(
    page: number = 1,
    ipp: number = 5,
    sort: string = '_id',
    rootAccess: string | undefined,
    type: string | undefined,
    search: string | undefined
  ): Observable<any> {
    return this._http.get(
      `${this.urlBlog}articles/${page}/${ipp}/${sort}${
        rootAccess ? `/${rootAccess}` : ''
      }${type ? `/${type}` : ''}${search ? `/${search}` : ''}`
    );
  }
  getArticleCats(): Observable<any> {
    return this._http.get(`${this.urlBlog}article-cats`);
  }
  getArticleSubCats(): Observable<any> {
    return this._http.get(`${this.urlBlog}article-sub-cats`);
  }
  getArticle(id: string): Observable<any> {
    return this._http.get(`${this.urlBlog}article/${id}`);
  }
  /* Update */
  updateArticle(article: any): Observable<any> {
    return this._http.put(
      `${this.urlBlog}article/${article._id}`,
      JSON.stringify(article)
    );
  }
  updateArticleSection(articleSection: any): Observable<any> {
    return this._http.put(
      `${this.urlBlog}article-section/${articleSection._id}`,
      JSON.stringify(articleSection)
    );
  }
  updateArticleCat(articleCat: any): Observable<any> {
    return this._http.put(
      `${this.urlBlog}article-cat/${articleCat._id}`,
      JSON.stringify(articleCat)
    );
  }
  updateArticleSubCat(articleSubCat: any): Observable<any> {
    return this._http.put(
      `${this.urlBlog}article-sub-cat/${articleSubCat._id}`,
      JSON.stringify(articleSubCat)
    );
  }
  /* Delete */
  deleteArticle(id: string): Observable<any> {
    return this._http.delete(`${this.urlBlog}article/${id}`);
  }
  deleteArticleSection(id: string): Observable<any> {
    return this._http.delete(`${this.urlBlog}article-section/${id}`);
  }
  deleteArticleCat(id: string): Observable<any> {
    return this._http.delete(`${this.urlBlog}article-cat/${id}`);
  }
  deleteArticleSubCat(id: string): Observable<any> {
    return this._http.delete(`${this.urlBlog}article-sub-cat/${id}`);
  }
}
