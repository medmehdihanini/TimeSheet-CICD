import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiviteDictionnaire } from '../../models/Categorie';

@Injectable({
  providedIn: 'root',
})
export class ActiviteDictionnaireService {
  private apiServerUrl = 'http://localhost:8083/api/activites-dictionnaire';

  constructor(private http: HttpClient) {}

  /**
   * Creates a new activity dictionary item with a category
   * @param categorieId The ID of the category to associate with the activity
   * @param activiteDictionnaire The activity dictionary object to create
   * @returns Observable with the API response
   */
  createActiviteDictionnaire(categorieId: number, activiteDictionnaire: ActiviteDictionnaire): Observable<any> {
    return this.http.post(`${this.apiServerUrl}/categorie/${categorieId}`, activiteDictionnaire, {
      responseType: 'text'
    });
  }

  /**
   * Updates an existing activity dictionary item
   * @param id The ID of the activity dictionary item to update
   * @param activiteDictionnaire The updated activity dictionary object
   * @returns Observable with the API response
   */
  updateActiviteDictionnaire(id: number, activiteDictionnaire: ActiviteDictionnaire): Observable<any> {
    return this.http.put(`${this.apiServerUrl}/${id}`, activiteDictionnaire, {
      responseType: 'text'
    });
  }

  /**
   * Deletes an activity dictionary item
   * @param id The ID of the activity dictionary item to delete
   * @returns Observable with the API response
   */
  deleteActiviteDictionnaire(id: number): Observable<any> {
    return this.http.delete(`${this.apiServerUrl}/${id}`, {
      responseType: 'text'
    });
  }

  /**
   * Gets a specific activity dictionary item by ID
   * @param id The ID of the activity dictionary item to get
   * @returns Observable with the API response
   */
  getActiviteDictionnaire(id: number): Observable<ActiviteDictionnaire> {
    return this.http.get<ActiviteDictionnaire>(`${this.apiServerUrl}/${id}`);
  }

  /**
   * Gets all activity dictionary items
   * @returns Observable with the API response containing all activity dictionary items
   */
  getAllActiviteDictionnaires(): Observable<ActiviteDictionnaire[]> {
    return this.http.get<ActiviteDictionnaire[]>(this.apiServerUrl);
  }

  /**
   * Gets all activity dictionary items by category ID
   * @param categorieId The ID of the category to filter by
   * @returns Observable with the API response containing filtered activity dictionary items
   */
  getActiviteDictionnairesByCategorie(categorieId: number): Observable<ActiviteDictionnaire[]> {
    return this.http.get<ActiviteDictionnaire[]>(`${this.apiServerUrl}/categorie/${categorieId}`);
  }
}
