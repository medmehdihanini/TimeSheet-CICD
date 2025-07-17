import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Request/Response interfaces for RAG API
export interface TaskSuggestionRequest {
  project_description: string;
  num_suggestions?: number;
  use_hybrid_search?: boolean;
}

export interface TaskSuggestion {
  task_text: string;
}

export interface SimilarTask {
  task_id: string;
  task_text: string;
  project_id: string;
  project_name: string;
  project_description: string;
  score: number;
}

export interface TaskSuggestionResponse {
  suggestions: TaskSuggestion[];
  similar_tasks: SimilarTask[];
  processing_time: number;
}

export interface QueryValidationRequest {
  text: string;
}

export interface QueryValidationResponse {
  is_coherent: boolean;
  relevance_score: number;
  confidence_level: string;
  should_process: boolean;
  enhancement_applied: boolean;
  recommendations: string[];
}

export interface DataReloadResponse {
  message: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class RagService {
  private apiServerUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get task suggestions based on project description
   * @param request - Contains project description and optional parameters
   * @returns Observable with task suggestions and similar tasks
   */
  public getSuggestedTasks(request: TaskSuggestionRequest): Observable<TaskSuggestionResponse> {
    const defaultRequest: TaskSuggestionRequest = {
      project_description: request.project_description,
      num_suggestions: request.num_suggestions || 5,
      use_hybrid_search: request.use_hybrid_search !== undefined ? request.use_hybrid_search : true
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<TaskSuggestionResponse>(
      `${this.apiServerUrl}/suggest-tasks`,
      defaultRequest,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate if the query is coherent and relevant for task suggestions
   * @param text - The text to validate
   * @returns Observable with validation results
   */
  public validateQuery(text: string): Observable<QueryValidationResponse> {
    const request: QueryValidationRequest = { text };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<QueryValidationResponse>(
      `${this.apiServerUrl}/validate-query`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reload task data in the backend (Admin function)
   * This method should be called after adding new tasks to refresh the RAG database
   * @returns Observable with reload status
   */
  public reloadTaskData(): Observable<DataReloadResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<DataReloadResponse>(
      `${this.apiServerUrl}/reload-data`,
      {},
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Convenience method to get suggestions with validation
   * This combines query validation and task suggestion in one call
   * @param projectDescription - The project description to get suggestions for
   * @param numSuggestions - Number of suggestions to return (default: 5)
   * @param useHybridSearch - Whether to use hybrid search (default: true)
   * @returns Observable with either validation error or task suggestions
   */
  public getSuggestionsWithValidation(
    projectDescription: string,

  ): Observable<TaskSuggestionResponse | { validationError: QueryValidationResponse }> {
    return new Observable(observer => {
      // First validate the query
      this.validateQuery(projectDescription).subscribe({
        next: (validationResult) => {
          if (validationResult.should_process) {
            // If validation passes, get suggestions
            this.getSuggestedTasks({
              project_description: projectDescription
            }).subscribe({
              next: (suggestions) => observer.next(suggestions),
              error: (error) => observer.error(error),
              complete: () => observer.complete()
            });
          } else {
            // If validation fails, return validation error
            observer.next({ validationError: validationResult });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Check if a project description is suitable for getting suggestions
   * @param projectDescription - The text to check
   * @returns Observable boolean indicating if the text is suitable
   */
  public isProjectDescriptionSuitable(projectDescription: string): Observable<boolean> {
    return new Observable(observer => {
      this.validateQuery(projectDescription).subscribe({
        next: (result) => {
          observer.next(result.should_process && result.confidence_level !== 'very_low');
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Error handling method
   * @param error - The error object
   * @returns Observable error
   */
  private handleError(error: any): Observable<never> {
    console.error('RAG Service Error:', error);
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
