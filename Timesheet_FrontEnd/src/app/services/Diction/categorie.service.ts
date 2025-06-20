import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categorie } from '../../models/Categorie';

@Injectable({
  providedIn: 'root',
})
export class CategorieService {
  private apiServerUrl = 'http://localhost:8083/api/categories';

  constructor(private http: HttpClient) {}

  /**
   * Creates a new category
   * @param categorie The category object to create
   * @returns Observable with the API response
   */
  createCategorie(categorie: Categorie): Observable<any> {
    return this.http.post(this.apiServerUrl, categorie, {
      responseType: 'text'
    });
  }

  /**
   * Updates an existing category
   * @param id The ID of the category to update
   * @param categorie The updated category object
   * @returns Observable with the API response
   */
  updateCategorie(id: number, categorie: Categorie): Observable<any> {
    return this.http.put(`${this.apiServerUrl}/${id}`, categorie, {
      responseType: 'text'
    });
  }

  /**
   * Deletes a category
   * @param id The ID of the category to delete
   * @returns Observable with the API response
   */
  deleteCategorie(id: number): Observable<any> {
    return this.http.delete(`${this.apiServerUrl}/${id}`, {
      responseType: 'text'
    });
  }

  /**
   * Gets a specific category by ID
   * @param id The ID of the category to get
   * @returns Observable with the API response
   */
  getCategorie(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.apiServerUrl}/${id}`);
  }

  /**
   * Gets all categories
   * @returns Observable with the API response containing all categories
   */
  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.apiServerUrl);
  }
}
