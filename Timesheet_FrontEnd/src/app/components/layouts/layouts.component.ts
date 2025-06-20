import { Component, computed, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CustomSidenavComponent } from '../custom-sidenav/custom-sidenav.component';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { HttpClientModule } from '@angular/common/http';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { NotificationService } from '../../services/notification/notification.service';
import { UserserviceService } from "../../services/user/userservice.service";
import { Notification, NotificationStatus } from '../../models/Notification';
import { Observable } from 'rxjs';
import { ChatContainerComponent } from '../chat/chat-container.component';

@Component({
  selector: 'app-layouts',
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatBadgeModule,
    MatTooltipModule,
    CustomSidenavComponent,
    NotificationDropdownComponent,
    HttpClientModule,
    ChatContainerComponent,
  ],
  providers: []
})
export class LayoutsComponent implements OnInit, OnDestroy {
  collapsed = signal(false);
  notifications$: Observable<Notification[]>;
  private socketClient: Client;
  private notificationSubscriber: any;
  private isLogsPage = false;

  constructor(
    private notificationService: NotificationService,
    private userSerice: UserserviceService,
    private router: Router
  ) {
    this.notifications$ = this.notificationService.notifications$;

    // Track page navigation to detect logs page
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const wasLogsPage = this.isLogsPage;
        this.isLogsPage = event.url.includes('/logs');

        if (this.isLogsPage) {
          console.log('🔍 Logs page loaded - Initializing logs WebSocket');
          if (this.socketClient && this.socketClient.connected) {
            console.log('✅ WebSocket connection already active for logs');
          }
        } else if (wasLogsPage) {
          console.log('📤 Leaving logs page');
        }
      }
    });
  }

  ngOnInit(): void {
    console.log('🔄 Initializing WebSocket connection...');
    let ws = new SockJS('http://localhost:8083/ws');
    this.socketClient = new Client({
      webSocketFactory: () => ws,
      debug: (msg: string) => {
        console.log('📡 STOMP:', msg);
      },
      onConnect: () => {
        console.log('🌐 WebSocket connected successfully!');
        const currentUser = this.userSerice.getUserConnected();
        console.log('👤 USERRRR ROLLEEE:', currentUser.role)    ;

        if (currentUser) {
          // Subscribe to notifications
          console.log('📩 Subscribing to notifications:', '/user/' + currentUser.email + '/notifications');
          this.notificationSubscriber = this.socketClient.subscribe(
            `/user/${currentUser.email}/notifications`,
            (message: any) => {
              console.log('📨 Received notification:', message.body);
              try {
                const notificationData = JSON.parse(message.body);
                const notification: Notification = {
                  message: notificationData.message,
                  title: notificationData.title || 'New Notification',
                  status: notificationData.status || NotificationStatus.INFO
                };
                this.notificationService.addNotification(notification);
              } catch (error) {
                console.error('❌ Error parsing notification:', error);
              }
            }
          );

          // Subscribe to logs based on user role
          if (currentUser.role) {
            console.log('📋 Setting up logs subscription for role:', currentUser.role);
            let logsDestination = '';

            switch (currentUser.role) {
              case 'SUPER_ADMIN':
                logsDestination = '/logs/admin';
                break;
              case 'PROGRAM_MANAGER':
                logsDestination = `/logs/program/${currentUser.id}`;
                break;
              case 'PROJECT_MANAGER':
                logsDestination = `/logs/project/${currentUser.id}`;
                break;
            }

            if (logsDestination) {
              console.log('📋 Subscribing to logs channel:', logsDestination);
              this.socketClient.subscribe(logsDestination, (message: any) => {
                console.log('📋 Received log:', message.body);
              });
            }
          }
        }
      },
      onStompError: (error: any) => {
        console.error('❌ WebSocket connection error:', error);
      },
      onWebSocketClose: () => {
        console.log('🔌 WebSocket connection closed');
      }
    });

    this.socketClient.activate();
    console.log('🚀 WebSocket activation initiated');
  }

  ngOnDestroy(): void {
    if (this.notificationSubscriber) {
      console.log('📤 Unsubscribing from notifications');
      this.notificationSubscriber.unsubscribe();
    }
    if (this.socketClient) {
      console.log('🔌 Deactivating WebSocket connection');
      this.socketClient.deactivate();
    }
  }

  sidenavWidth = computed(() => this.collapsed() ? '65px' : '250px');

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Auto collapse sidenav on small screens
    if (event.target.innerWidth <= 768 && !this.collapsed()) {
      this.collapsed.set(true);
    }
  }

  handleNotificationClick() {
    // Handle notification click
    console.log('Notifications clicked');
  }

  handleSettingsClick() {
    // Handle settings click
    console.log('Settings clicked');
  }
}
