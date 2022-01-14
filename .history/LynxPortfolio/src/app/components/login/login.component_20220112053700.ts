import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

// Services
import { MainService } from '../../services/main.service';
import { WebService } from '../../services/web.service';
import { SharedService } from '../../services/shared.service';

// Models
import { User } from '../../models/main';

// Extras
import Swal from 'sweetalert2';
import { style } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public user: User = new User('', '', '', '');
  public identity: any;
  public token: any;

  // Console Settings
  public document: string = 'login.component.ts';
  public customConsoleCSS =
    'background-color: rgba(123,45,100,0.75); color: white; padding: 1em;';

  // Utility
  public windowWidth = window.innerWidth;
  constructor(
    private _mainService: MainService,

    private _route: ActivatedRoute,
    private _router: Router,
    private _webService: WebService,

    private _sharedService: SharedService
  ) {
    _sharedService.changeEmitted$.subscribe((sharedContent) => {
      if (
        typeof sharedContent === 'object' &&
        sharedContent.from !== 'login' &&
        (sharedContent.to === 'login' || sharedContent.to === 'all')
      ) {
        switch (sharedContent.property) {
          case 'identity':
            this.identity = sharedContent.thing;
            break;
          case 'windowWidth':
            this.windowWidth = sharedContent.thing;
            break;
          case 'onlyConsoleMessage':
            this._webService.consoleLog(
              sharedContent.thing,
              this.document + ' 51',
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
      this.document + ' 60',
      this.customConsoleCSS
    );
    this._sharedService.emitChange({
      from: 'app',
      to: 'all',
      property: 'identity',
      thing: this.identity,
    });
  }

  ngOnInit(): void {
    this._sharedService.emitChange({
      from: 'login',
      to: 'all',
      property: 'onlyConsoleMessage',
      thing: 'Data from login',
    });
  }

  async onSubmit() {
    try {
      let user = await this._mainService.login(this.user).toPromise();
      if (!user || !user.user) {
        throw new Error('No se encontró el usuario.');
      }

      let token = await this._mainService.login(this.user, true).toPromise();
      if (!token || !token.token) {
        throw new Error('No se pudo conseguir el token.');
      }

      this.identity = user.user;
      this._webService.consoleLog(
        this.identity,
        this.document + ' 57',
        this.customConsoleCSS
      );
      this.token = token.token;
      this._webService.consoleLog(
        this.token,
        this.document + ' 63',
        this.customConsoleCSS
      );

      //LocalStorage del identity
      localStorage.setItem('identity', JSON.stringify(this.identity));

      this._sharedService.emitChange({
        from: 'login',
        to: 'all',
        property: 'identity',
        thing: this.identity,
      });

      //LocalStorage del token
      localStorage.setItem('token', this.token);

      this._router.navigate(['/inicio']);

      //Alerta
      Swal.fire({
        title: 'Usuario logueado correctamente',
        html: 'El usuario se ha identificado correctamente.',
        icon: 'success',
        customClass: {
          popup: 'bg-bg1M',
          title: 'text-bg-whatsApp',
          closeButton: 'bg-whatsApp',
          confirmButton: 'bg-whatsApp',
        },
      });
    } catch (e: any) {
      this._webService.consoleLog(
        e,
        this.document + ' 59',
        this.customConsoleCSS
      );

      //Alerta
      Swal.fire({
        title: 'Usuario no logueado',
        html:
          'El usuario no se ha logueado correctamente. <br/> ' +
          e.error.message,
        icon: 'error',
        customClass: {
          popup: 'bg-bg1M',
          title: 'text-titleM',
          closeButton: 'bg-titleM',
          confirmButton: 'bg-titleM',
        },
      });
    }
  }
}
