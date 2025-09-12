/**
 * View Routes
 * Handles rendering of EJS templates and static pages
 */

import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BaseRouter } from './base/BaseRouter';

export class ViewRoutes extends BaseRouter {
  constructor() {
    super();
    this.setupRoutes();
  }

  protected setupRoutes(): void {
    // Main pages
    this.router.get('/', this.dashboard.bind(this));
    this.router.get('/dashboard', this.dashboard.bind(this));
    
    // SIP Phone
    this.router.get('/sip-phone', this.sipPhone.bind(this));
    
    // Broadcast
    this.router.get('/broadcast', this.broadcast.bind(this));
    
    // Employees
    this.router.get('/employees', this.employees.bind(this));
    
    // Call History
    this.router.get('/call-history', this.callHistory.bind(this));
    
    // Reports
    this.router.get('/reports', this.reports.bind(this));
    
    // Audio Files
    this.router.get('/audio-files', this.audioFiles.bind(this));
    
    // User Management
    this.router.get('/users', this.users.bind(this));
    
    // Settings
    this.router.get('/settings', this.settings.bind(this));
  }

  /**
   * Render dashboard page
   */
  private async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Bosh sahifa',
        user: this.getCurrentUser(req),
        currentPage: 'dashboard'
      };

      res.render('dashboard', pageData);
    } catch (error) {
      console.error('Dashboard render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Sahifani yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render SIP phone page
   */
  private async sipPhone(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'SIP Telefon',
        user: this.getCurrentUser(req),
        currentPage: 'sip-phone'
      };

      res.render('sip-phone', pageData);
    } catch (error) {
      console.error('SIP Phone render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'SIP telefon sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render broadcast page
   */
  private async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Xabar yuborish',
        user: this.getCurrentUser(req),
        currentPage: 'broadcast'
      };

      res.render('broadcast', pageData);
    } catch (error) {
      console.error('Broadcast render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Xabar yuborish sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render employees page
   */
  private async employees(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Xodimlar',
        user: this.getCurrentUser(req),
        currentPage: 'employees'
      };

      res.render('employees', pageData);
    } catch (error) {
      console.error('Employees render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Xodimlar sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render call history page
   */
  private async callHistory(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Qo\'ng\'iroqlar tarixi',
        user: this.getCurrentUser(req),
        currentPage: 'call-history'
      };

      res.render('call-history', pageData);
    } catch (error) {
      console.error('Call History render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Qo\'ng\'iroqlar tarixi sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render reports page
   */
  private async reports(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Hisobotlar',
        user: this.getCurrentUser(req),
        currentPage: 'reports'
      };

      res.render('reports', pageData);
    } catch (error) {
      console.error('Reports render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Hisobotlar sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render audio files page
   */
  private async audioFiles(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Audio fayllar',
        user: this.getCurrentUser(req),
        currentPage: 'audio-files'
      };

      res.render('audio-files', pageData);
    } catch (error) {
      console.error('Audio Files render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Audio fayllar sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render users page
   */
  private async users(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Foydalanuvchilar',
        user: this.getCurrentUser(req),
        currentPage: 'users'
      };

      res.render('users', pageData);
    } catch (error) {
      console.error('Users render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Foydalanuvchilar sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Render settings page
   */
  private async settings(req: Request, res: Response): Promise<void> {
    try {
      const pageData = {
        title: 'Sozlamalar',
        user: this.getCurrentUser(req),
        currentPage: 'settings'
      };

      res.render('settings', pageData);
    } catch (error) {
      console.error('Settings render error:', error);
      res.status(500).render('error', {
        title: 'Xatolik',
        error: 'Sozlamalar sahifasini yuklashda xatolik yuz berdi'
      });
    }
  }

  /**
   * Get current user from session/request
   */
  private getCurrentUser(req: Request): any {
    // TODO: Implement proper user session management
    // For now, return mock user data
    return {
      id: 'user-1',
      name: 'Administrator',
      role: 'admin',
      permissions: {
        sipPhone: true,
        broadcast: true,
        employees: true,
        reports: true,
        users: true,
        audioFiles: true
      }
    };
  }
}