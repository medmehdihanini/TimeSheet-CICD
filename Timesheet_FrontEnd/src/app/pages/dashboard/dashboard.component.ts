import { Component, OnInit } from '@angular/core';

import { UserserviceService } from 'src/app/services/user/userservice.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';  // Import du DomSanitizer

 

@Component({

  selector: 'app-dashboard',

  templateUrl: './dashboard.component.html',

  styleUrls: ['./dashboard.component.css']

})

export class TableauBordComponent implements OnInit {

 

  dashboardUrl: SafeResourceUrl = '';  // Le type est maintenant SafeResourceUrl

  chefDeProgramme: string = '';  // Variable pour afficher le nom complet de l'utilisateur

 

  constructor(private userService: UserserviceService, private sanitizer: DomSanitizer) {}  // Injection de DomSanitizer

 

  ngOnInit(): void {

    const user = this.userService.getUserConnected();  // Récupérer l'utilisateur connecté

 

    if (user) {

      if (user.role === 'SUPER_ADMIN' || user.role ==='PARTNER') {

        // URL pour l'Admin

        let adminUrl = 'https://app.powerbi.com/reportEmbed?reportId=67f0d6b3-205e-441b-842d-c8b221d4ce84&autoAuth=true';

        adminUrl = decodeURIComponent(adminUrl);  // Décodage de l'URL

        this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(adminUrl);

 

        // Affichage pour vérification

        console.log('URL générée pour Admin:', adminUrl);

 

      } else if (user.role === 'PROGRAM_MANAGER' || user.role === 'GPS_LEAD') {

        // Concatène le prénom et le nom pour le Chef de Programme

        this.chefDeProgramme = `${user.firstname}${user.lastname}`;

        const encodedChefDeProgramme = encodeURIComponent(this.chefDeProgramme);

 

        // URL pour le Chef de Programme

        let chefUrl = `https://app.powerbi.com/reportEmbed?reportId=67f0d6b3-205e-441b-842d-c8b221d4ce84&autoAuth=true&pageName=Gestiondesfactures&filter=_program/NomCompletchefdeprog%20eq%20%27${encodedChefDeProgramme}%27`;

        

        this.dashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(chefUrl);

 

        // Affichage pour vérification

        console.log('URL générée pour Chef de Programme:', chefUrl);
        

 

      } else {

        // Gérer les autres rôles si nécessaire ou rediriger l'utilisateur

        console.log('Rôle non reconnu ou accès refusé.');

      }

    }

  }

}