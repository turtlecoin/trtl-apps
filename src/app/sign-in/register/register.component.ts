import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/providers/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  ngUnsubscribe: Subject<any> = new Subject();
  form: FormGroup;
  status$: Subject<string> = new Subject<string>();
  working = false;
  continue: string | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService) {

    this.form = new FormGroup({
      email: new FormControl('', Validators.compose([Validators.required])),
      password: new FormControl('', Validators.compose([Validators.required])),
      confirmPassword: new FormControl('', Validators.compose([Validators.required]))
    });
  }

  ngOnInit() {
    this.route.queryParams
    .pipe(filter(params => params.continue))
    .subscribe(params => {
      this.continue = params.continue;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.status$.complete();
  }

  checkPasswordMatch(): boolean {
    return this.form.controls.password.value === this.form.controls.confirmPassword.value;
  }

  async onSubmit(result: any) {
    this.working = true;
    const statusStream = this.status$;
    statusStream.next('');

    try {
      await this.auth.createUserWithEmailAndPassword(result.email, result.password);
      await this.auth.sendVerificationEmail();

      this.router.navigate(['/console']);
    } catch (error) {
      statusStream.next(`error creating account: ${error.message}`);
    } finally {
      this.working = false;
    }
  }
}
