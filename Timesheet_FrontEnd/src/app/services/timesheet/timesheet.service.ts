import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimesheetService {
  private apiserverUrl = 'http://localhost:8083/api/v1/timesheet';

  constructor(private http: HttpClient) {}

  addAssignTimesheet(
    month: number,
    year: number,
    idproject: number,
    idprofile: number
  ): Observable<any> {
    const url = `${this.apiserverUrl}/add`;
    const params = {
      month: month.toString(),
      year: year.toString(),
      idproject: idproject.toString(),
      idprofile: idprofile.toString(),
    };

    return this.http.post<any>(url, null, { params });
  }

  getTimesheetByMonthAndYear(
    month: string,
    year: string,
    idproject: number,
    idprofile: number
  ): Observable<any> {
    const url = `${this.apiserverUrl}/get`;
    const params = {
      month: month.toString(),
      year: year.toString(),
      idproject: idproject.toString(),
      idprofile: idprofile.toString(),
    };

    return this.http.get<any>(url, { params });
  }

  ChangeTimsheetStatus(idtimesheet: any, trigger: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiserverUrl}/changesatatus/${idtimesheet}/${trigger}`,
      null
    );
  }

  getTimesheetsByProjectId(projectId: number,status:any): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/projectTimesheets/${projectId}/${status}`
    );
  }
  sendEmail(timesheetId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/sendEmail/${timesheetId}`
    );
  }
  sendAprouvalEmail(timesheetId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiserverUrl}/sendAprouvalEmail/${timesheetId}`
    );
  }
}
