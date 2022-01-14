import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalMain } from './global';

@Injectable()
export class MainService {
  public urlMain: string;
  public identity: any;
  public token: any;

  constructor(private _http: HttpClient) {
    this.urlMain = GlobalMain.url;
  }

  // Pruebas
  pruebas() {
    return 'Soy el servicio de main.';
  }

  // Create
  createAlbum(album: any): Observable<any> {
    let body = JSON.stringify(album);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'album', body, {
      headers: headers,
    });
  }

  createBookImg(bookImg: any): Observable<any> {
    let body = JSON.stringify(bookImg);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'book-img', body, {
      headers: headers,
    });
  }

  createCVSection(cvSection: any): Observable<any> {
    let body = JSON.stringify(cvSection);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'cv-section', body, {
      headers: headers,
    });
  }

  createCVSubSection(cvSubSection: any): Observable<any> {
    let body = JSON.stringify(cvSubSection);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'cv-sub-section', body, {
      headers: headers,
    });
  }

  createMain(main: any): Observable<any> {
    let body = JSON.stringify(main);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this._http.post(this.urlMain + 'main', body, {
      headers: headers,
    });
  }

  createSong(song: any): Observable<any> {
    let body = JSON.stringify(song);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'song', body, {
      headers: headers,
    });
  }

  createVideo(video: any): Observable<any> {
    let body = JSON.stringify(video);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'video', body, {
      headers: headers,
    });
  }

  createWebSite(webSite: any): Observable<any> {
    let body = JSON.stringify(webSite);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.post(this.urlMain + 'web-site', body, {
      headers: headers,
    });
  }

  // Get
  getAlbums(): Observable<any> {
    return this._http.get(this.urlMain + 'albums');
  }

  getBookImgs(): Observable<any> {
    return this._http.get(this.urlMain + 'book-imgs');
  }

  getCVSections(): Observable<any> {
    return this._http.get(this.urlMain + 'cv-sections');
  }

  getMain(): Observable<any> {
    return this._http.get(this.urlMain + 'main');
  }

  getSongs(): Observable<any> {
    return this._http.get(this.urlMain + 'songs');
  }

  getVideos(): Observable<any> {
    return this._http.get(this.urlMain + 'videos');
  }

  getWebSites(): Observable<any> {
    return this._http.get(this.urlMain + 'web-sites');
  }

  // Put
  updateAlbum(id: string, album: any): Observable<any> {
    let body = JSON.stringify(album);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'album/' + id, body, {
      headers: headers,
    });
  }

  updateBookImg(id: string, bookImg: any): Observable<any> {
    let body = JSON.stringify(bookImg);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'book-img/' + id, body, {
      headers: headers,
    });
  }

  updateCVSection(id: string, cvSection: any): Observable<any> {
    let body = JSON.stringify(cvSection);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'cv-section/' + id, body, {
      headers: headers,
    });
  }

  updateCVSubSection(id: string, cvSubSection: any): Observable<any> {
    let body = JSON.stringify(cvSubSection);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'cv-sub-section/' + id, body, {
      headers: headers,
    });
  }

  updateMain(main: any): Observable<any> {
    let body = JSON.stringify(main);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'main', body, {
      headers: headers,
    });
  }

  updateSong(id: string, song: any): Observable<any> {
    let body = JSON.stringify(song);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'song/' + id, body, {
      headers: headers,
    });
  }

  updateVideo(id: string, video: any): Observable<any> {
    let body = JSON.stringify(video);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'video/' + id, body, {
      headers: headers,
    });
  }

  updateWebsite(id: string, webSite: any): Observable<any> {
    let body = JSON.stringify(webSite);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.put(this.urlMain + 'web-site/' + id, body, {
      headers: headers,
    });
  }

  // Delete
  deleteAlbum(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'album/' + id, {
      headers: headers,
    });
  }

  deleteBookImg(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'book-img/' + id, {
      headers: headers,
    });
  }

  deleteCVSection(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'cv-section/' + id, {
      headers: headers,
    });
  }

  deleteCVSubSection(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'cv-sub-section/' + id, {
      headers: headers,
    });
  }

  deleteSong(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'song/' + id, {
      headers: headers,
    });
  }

  deleteVideo(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'video/' + id, {
      headers: headers,
    });
  }

  deleteWebSite(id: string): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.getToken(),
    });

    return this._http.delete(this.urlMain + 'web-site/' + id, {
      headers: headers,
    });
  }

  // LocalStorage
  getToken() {
    this.token = localStorage.getItem('token');

    if (!this.token) {
      this.token = sessionStorage.getItem('token');
    }

    return this.token;
  }
}
