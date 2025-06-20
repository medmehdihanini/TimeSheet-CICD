export interface Categorie {
    id?: number;
    name: string;
    activiteDictionnaires?: ActiviteDictionnaire[];
}

export interface ActiviteDictionnaire {
    id?: number;
    description: string;
    categorie?: Categorie;
}
