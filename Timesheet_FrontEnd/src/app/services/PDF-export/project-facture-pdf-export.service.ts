import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { EventService } from '../event/event.service';
import { ProjectService } from '../project/project.service';

// Interface for project facture information
export interface ProjectFactureInformation {
  Month: string;
  Year: string;
  ProjectName: string;
  ContractNumber: string;
  profiles: ProfileFactureData[];
  totalAmount: number;
}

// Interface for individual profile data in project facture
export interface ProfileFactureData {
  ExpertName: string;
  function: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
}

// Define the TableLayout interface
interface TableLayout {
  hLineColor?: (i: number, node: any) => string;
  vLineColor?: (i: number, node: any) => string;
  hLineWidth?: (i: number, node: any) => number;
  vLineWidth?: (i: number, node: any) => number;
  paddingLeft?: (i: number, node: any) => number;
  paddingRight?: (i: number, node: any) => number;
  paddingTop?: (i: number, node: any) => number;
  paddingBottom?: (i: number, node: any) => number;
}

// Properly set up the virtual file system for pdfMake
(pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts;

@Injectable({
  providedIn: 'root',
})
export class ProjectFacturePdfExportService {
  private projectId: number = 0;

  constructor(
    private eventServ: EventService,
    private projectserv: ProjectService
  ) {}

  async generateProjectFacture(projectId: number, month: string, year: string): Promise<void> {
    this.projectId = projectId;

    try {      console.log(`Generating facture for project ${projectId}, month: ${month}, year: ${year}`);
        // Call the API to get tasks by project and month/year
      const monthYear = `${month.toString().padStart(2, '0')}/${year}`;
      const data = await this.eventServ.getTasksByProjectAndMonthYear(monthYear, projectId).toPromise();

      console.log('API Response:', data);

      // Process the data and generate PDF
      const factureData = await this.processProjectFactureData(data, month, year);
      this.exportProjectFactureToPdf(factureData);

    } catch (error) {
      console.error('Error generating project facture:', error);
      throw error;
    }
  }

  private async processProjectFactureData(data: any, month: string, year: string): Promise<any> {
    console.log('Processing project facture data:', data);

    // Get daily rates for all profiles in the project
    let profileRatesMap: Map<number, { dailyRate: number, fonction: string }> = new Map();

    try {
      const profilesData = await this.projectserv.getProjectProfiles(this.projectId).toPromise();
      console.log('Project profiles data:', profilesData);

      // Create a map of profileId to daily rate and function
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach((profile: any) => {
          if (Array.isArray(profile) && profile.length > 5) {
            const profileId = profile[0]; // profileId at index 0
            const dailyRate = profile[5]; // dailyRate at index 5
            const fonction = profile[3]; // fonction at index 3
            profileRatesMap.set(profileId, { dailyRate, fonction });
            console.log(`Profile ${profileId}: dailyRate=${dailyRate}, fonction=${fonction}`);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching project profiles:', error);
      // Fallback to default rates if API call fails
      profileRatesMap = this.getDefaultProfileRates(data.profiles || []);
    }    // If no rates were found, use default rates
    if (profileRatesMap.size === 0) {
      console.log('No profile rates found, using default rates');
      profileRatesMap = this.getDefaultProfileRates(data.profiles || []);
    }    // Get project details to retrieve contract number using the same pattern as timesheet-table.component
    let contractNumber = (data.projectId || 1).toString();
    let project: any = null;

    console.log('=== Starting contract number retrieval ===');
    console.log('Initial fallback contractNumber:', contractNumber);
    console.log('Project ID used for getProjectDetails:', this.projectId);

    try {
      // Use Promise wrapper to handle the Observable the same way as timesheet-table.component
      project = await new Promise((resolve, reject) => {
        this.projectserv.getProjectDetails(this.projectId).subscribe(
          (response: any) => {
            console.log('=== Project details response received ===');
            console.log('Raw response:', response);
            console.log('Response type:', typeof response);
            console.log('Is array:', Array.isArray(response));
            resolve(response);
          },
          (error) => {
            console.error('=== Error fetching project details ===', error);
            reject(error);
          }
        );
      });

      // Access contract number the same way as timesheet-table.component
      console.log('=== Processing project details for contract number ===');
      console.log('Project exists:', !!project);
      console.log('Project.program exists:', !!(project && project.program));
      console.log('Project.program.numcontrat exists:', !!(project && project.program && project.program.numcontrat));

      if (project && project.program && project.program.numcontrat) {
        contractNumber = project.program.numcontrat.toString();
        console.log('✅ Contract number found in project.program.numcontrat:', contractNumber);
      } else {
        console.log('❌ No contract number found in project.program.numcontrat');
        console.log('Full project structure:', JSON.stringify(project, null, 2));
        console.log('Using fallback contract number:', contractNumber);
      }
    } catch (error) {
      console.error('=== Error loading project details ===', error);
      console.log('Using fallback contract number:', contractNumber);
    }

    console.log('=== Final contract number ===', contractNumber);const factureData = {
      ProjectName: (project && project.nom) ? project.nom : (data.projectName || 'Project Name'),
      Month: month,
      Year: year,
      ContractNumber: contractNumber,
      profiles: [] as any[],
      totalAmount: 0
    };

    // Process each profile from the profiles array in the API response
    const profiles = data.profiles || [];
    profiles.forEach((profile: any) => {
      console.log('Processing profile:', profile);

      // Get daily rate for this profile
      const rateInfo = profileRatesMap.get(profile.profileId) || { dailyRate: 500, fonction: 'Consultant' };

      // Calculate total days for this profile
      const totalDays = profile.tasks.reduce((sum: number, task: any) => {
        return sum + (task.nbJour || 0);
      }, 0);

      // Calculate amount for this profile
      const amount = totalDays * rateInfo.dailyRate;

      const profileData = {
        ExpertName: profile.profileName,
        function: rateInfo.fonction,
        dailyRate: rateInfo.dailyRate,
        totalDays: totalDays,
        totalAmount: amount,
        tasks: profile.tasks.map((task: any) => ({
          date: task.datte,
          description: task.text,
          days: task.nbJour,
          workPlace: task.workPlace
        }))
      };

      factureData.profiles.push(profileData);
      factureData.totalAmount += amount;

      console.log(`Profile ${profile.profileName}: ${totalDays} days × ${rateInfo.dailyRate} = ${amount}`);
    });

    console.log('Final facture data:', factureData);
    return factureData;
  }

  private getDefaultProfileRates(profiles: any[]): Map<number, { dailyRate: number, fonction: string }> {
    const defaultRatesMap = new Map<number, { dailyRate: number, fonction: string }>();

    // Create default rates based on profiles in the data
    profiles.forEach((profile: any) => {
      // Default rates based on typical consulting roles
      const defaultRate = 500; // Default daily rate
      const defaultFonction = 'Consultant'; // Default function

      defaultRatesMap.set(profile.profileId, {
        dailyRate: defaultRate,
        fonction: defaultFonction
      });
    });

    return defaultRatesMap;
  }

  exportProjectFactureToPdf(projectFactureInfo: ProjectFactureInformation): void {
    // Define the PDF document structure for the project facture
    const docDefinition = this.createProjectFacturePdfDocument(projectFactureInfo);

    // Generate filename for the project facture
    const projectName = projectFactureInfo.ProjectName.replace(/\s+/g, '_');
    const monthYear = `${projectFactureInfo.Month}_${projectFactureInfo.Year}`;
    const filename = `Facture_Projet_${projectName}_${monthYear}.pdf`;

    pdfMake.createPdf(docDefinition).download(filename);
  }

  private createProjectFacturePdfDocument(projectFactureInfo: ProjectFactureInformation): any {
    // Create table body for profiles
    const profileTableBody = [
      [
        { text: 'Expert', style: 'tableHeader' },
        { text: 'Fonction', style: 'tableHeader' },
        { text: 'Jours', style: 'tableHeader' },
        { text: 'Taux/Jour (TND)', style: 'tableHeader' },
        { text: 'Montant (TND)', style: 'tableHeader' }
      ]
    ];    // Add each profile as a row
    projectFactureInfo.profiles.forEach(profile => {
      profileTableBody.push([
        { text: profile.ExpertName, style: 'tableCell' } as any,
        { text: profile.function, style: 'tableCell' } as any,
        { text: `${profile.totalDays}`, style: 'tableCell', alignment: 'center' } as any,
        { text: `${profile.dailyRate.toFixed(2)}`, style: 'tableCell', alignment: 'right' } as any,
        { text: `${profile.totalAmount.toFixed(2)}`, style: 'tableCell', alignment: 'right' } as any
      ]);    });

    // Add total row
    profileTableBody.push([
      { text: 'TOTAL', style: 'totalLabel', colSpan: 4, alignment: 'right' } as any,
      {} as any,
      {} as any,
      {} as any,
      { text: `${projectFactureInfo.totalAmount.toFixed(2)} TND`, style: 'totalAmount', alignment: 'right' } as any
    ]);

    return {
      content: [
        // Header
        {
          text: 'FACTURE PROJET',
          style: 'mainTitle',
          alignment: 'center'
        },
        { text: '', margin: [0, 10] },

        // Period Section
        {
          columns: [
            { width: '*', text: '' }, // Left spacer
            {
              width: 'auto',
              stack: [
                {
                  text: `Mois : ${projectFactureInfo.Month}`,
                  style: 'periodText',
                  alignment: 'left'
                },
                {
                  text: `Année : ${projectFactureInfo.Year}`,
                  style: 'periodText',
                  alignment: 'left',
                  margin: [0, 3, 0, 0]
                }
              ]
            },
          ],
          margin: [0, 0, 0, 15]
        },

        // Project Information
        {
          table: {
            widths: ['25%', '*'],
            body: [
              [
                { text: 'N° de Projet / Nom', style: 'labelText' },
                { text: projectFactureInfo.ProjectName, style: 'valueText' }
              ],              [
                { text: 'N° de contrat', style: 'labelText' },
                { text: projectFactureInfo.ContractNumber, style: 'valueText' }
              ]
            ]
          },
          layout: this.createInfoTableLayout(),
          margin: [0, 0, 0, 20]
        },

        // Calculation Section
        {
          text: 'DÉTAIL DE LA FACTURATION PAR EXPERT',
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 10, 0, 15]
        },

        // Profiles Table
        {
          table: {
            widths: ['25%', '20%', '15%', '20%', '20%'],
            body: profileTableBody
          },
          layout: {
            hLineColor: (i: number, node: any) => {
              if (i === 0 || i === node.table.body.length) return 'black';
              if (i === node.table.body.length - 1) return 'black'; // Line before total
              return '#dddddd';
            },
            vLineColor: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 'black' : '#dddddd',
            hLineWidth: (i: number, node: any) => {
              if (i === node.table.body.length - 1) return 2; // Thicker line before total
              return 1;
            },
            vLineWidth: () => 1,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#f0f0f0'; // Header
              if (rowIndex === profileTableBody.length - 1) return '#e6f3ff'; // Total row
              return null;
            }
          },
          margin: [0, 0, 0, 30]
        },



        // Signatures Section
        {
          columns: [
            {
              width: '48%',
              stack: [
                { text: 'Signature du Chef de Projet', style: 'signatureLabel', alignment: 'left' },
                { text: '', margin: [0, 30] },
                { text: 'Date: ____________________', style: 'signatureDate' },
                { text: 'Signature: ____________________', style: 'signatureDate' }
              ]
            },
            { width: '4%', text: '' }, // Spacer
            {
              width: '48%',
              stack: [
                { text: 'Signature du Responsable', style: 'signatureLabel', alignment: 'right' },
                { text: '', margin: [0, 30] },
                { text: 'Date: ____________________', style: 'signatureDate', alignment: 'right' },
                { text: 'Signature: ____________________', style: 'signatureDate', alignment: 'right' }
              ]
            }
          ],
          margin: [0, 30, 0, 0]
        }
      ],
      styles: {        mainTitle: {
          fontSize: 24,
          bold: true,
          color: '#000000', // Black
          margin: [0, 0, 0, 20]
        },
        periodText: {
          fontSize: 12,
          bold: true,
          color: '#2E2E38' // EY Dark Gray
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#2E2E38' // EY Dark Gray
        },
        labelText: {
          fontSize: 11,
          bold: true,
          color: '#2E2E38', // EY Dark Gray
          margin: [0, 4, 0, 4]
        },
        valueText: {
          fontSize: 11,
          color: '#000000',
          margin: [0, 4, 0, 4]
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: '#2E2E38', // EY Dark Gray
          alignment: 'center'
        },
        tableCell: {
          fontSize: 10,
          color: '#000000'
        },
        totalLabel: {
          fontSize: 12,
          bold: true,
          color: '#2E2E38' // EY Dark Gray
        },
        totalAmount: {
          fontSize: 12,
          bold: true,
          color: '#2E2E38' // EY Dark Gray
        },
        paymentInfo: {
          fontSize: 11,
          color: '#2E2E38' // EY Dark Gray
        },
        signatureLabel: {
          fontSize: 11,
          bold: true,
          color: '#2E2E38' // EY Dark Gray
        },
        signatureDate: {
          fontSize: 10,
          color: '#2E2E38' // EY Dark Gray
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };
  }

  private createInfoTableLayout(): TableLayout {
    return {
      hLineColor: () => '#dddddd',
      vLineColor: () => '#dddddd',
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    };
  }
}
