import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  adminUser = false;
  private uid: string | undefined;

  constructor(
    public firebaseAuth: AngularFireAuth,
    private router: Router) {

    this.firebaseAuth.user.subscribe(async user => {
      if (user) {
        this.uid = user.uid;
        this.adminUser = false;

        const idTokenResult = await user.getIdTokenResult();

        if (idTokenResult) {
          if (!!idTokenResult.claims.admin) {
            this.adminUser = true;
          }
        }
      } else {
        this.uid = undefined;
        this.adminUser = false;
      }
    });
  }

  getUid(): string | undefined {
    return this.uid;
  }

  createUserWithEmailAndPassword(email: string, password: string): Promise<auth.UserCredential> {
    return this.firebaseAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  signInWithEmailAndPassword(email: string, password: string): Promise<any> {
    return this.firebaseAuth.auth.signInWithEmailAndPassword(email, password);
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return this.firebaseAuth.auth.sendPasswordResetEmail(email);
  }

  async signout(): Promise<void> {
    await this.firebaseAuth.auth.signOut();
    this.router.navigateByUrl('/home');
  }
}
