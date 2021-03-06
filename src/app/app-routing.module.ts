import { NgModule } from '@angular/core';
import { AngularFireAuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ConsoleComponent } from './console/console.component';
import { RegisterComponent } from './sign-in/register/register.component';
import { NewProjectComponent } from './console/new-project/new-project.component';
import { OverviewComponent } from './console/project/overview/overview.component';
import { WebapiComponent } from './console/project/webapi/webapi.component';
import { SupportComponent } from './support/support.component';
import { AdminComponent } from './admin/admin.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { WithdrawalInspectorComponent } from './admin/withdrawal-inspector/withdrawal-inspector.component';
import { DepositInspectorComponent } from './admin/deposit-inspector/deposit-inspector.component';
import { ReportsComponent } from './admin/reports/reports.component';
import { AdminGuard } from './guards/admin-guard.service';
import { WalletManagementComponent } from './admin/wallet-management/wallet-management.component';
import { RoleManagementComponent } from './admin/role-management/role-management.component';
import { AppInspectorComponent } from './admin/app-inspector/app-inspector.component';
import { AppAuditDetailsComponent } from './admin/app-audit-details/app-audit-details.component';
import { ServiceInvitationsComponent } from './admin/service-invitations/service-invitations.component';

const redirectUnauthorizedToSignIn  = () => redirectUnauthorizedTo(['/signin']);
const redirectLoggedInToConsole     = () => redirectLoggedInTo(['/console']);

const routes: Routes = [
  {
    path:         'support',
    component:    SupportComponent,
  },
  {
    path:         'signin',
    component:    SignInComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectLoggedInToConsole }
  },
  {
    path:         'register',
    component:    RegisterComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectLoggedInToConsole }
  },
  {
    path:         'user/profile',
    component:    UserProfileComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectUnauthorizedToSignIn }
  },
  {
    path:         'console',
    component:    ConsoleComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectUnauthorizedToSignIn }
  },
  {
    path:         'admin',
    component:    AdminComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/wallet-management',
    component:    WalletManagementComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/role-management',
    component:    RoleManagementComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/reports',
    component:    ReportsComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/service-invitations',
    component:    ServiceInvitationsComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/app-inspector',
    component:    AppInspectorComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/app-inspector/audit/:auditId',
    component:    AppAuditDetailsComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/deposit-inspector',
    component:    DepositInspectorComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'admin/withdrawal-inspector',
    component:    WithdrawalInspectorComponent,
    canActivate:  [AdminGuard]
  },
  {
    path:         'newapp',
    component:    NewProjectComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectUnauthorizedToSignIn }
  },
  {
    path:         'app/:appId/overview',
    component:    OverviewComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectUnauthorizedToSignIn }
  },
  {
    path:         'app/:appId/webapi',
    component:    WebapiComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectUnauthorizedToSignIn }
  },
  {
    path:         'home',
    component:    HomeComponent,
    canActivate:  [AngularFireAuthGuard],
    data:         { authGuardPipe: redirectLoggedInToConsole }
  },
  {
    path:         '**',
    redirectTo:   '/home',
    pathMatch:    'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
