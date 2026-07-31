import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { ExploreComponent } from './pages/explore.component';
import { KitchenDetailComponent } from './pages/kitchen-detail.component';
import { BookComponent } from './pages/book.component';
import { ReservationsComponent } from './pages/reservations.component';
import { BookingDetailComponent } from './pages/booking-detail.component';
import { ProfileComponent } from './pages/profile.component';
import { OpsDashboardComponent } from './pages/ops-dashboard.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'entrar', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'explorar', component: ExploreComponent },
  { path: 'cocinas/:slug', component: KitchenDetailComponent },
  { path: 'reservar/:slug', component: BookComponent },
  { path: 'reservas', component: ReservationsComponent },
  { path: 'reservas/:id', component: BookingDetailComponent },
  { path: 'perfil', component: ProfileComponent },
  { path: 'ops', component: OpsDashboardComponent },
  { path: '**', redirectTo: '' },
];
