package tn.ey.timesheetclient.timesheet.service;

import tn.ey.timesheetclient.timesheet.model.ExcelMetadataDTO;
import tn.ey.timesheetclient.timesheet.model.ResourceDTO;

public interface ExcelService {
    ResourceDTO exportExcel(ExcelMetadataDTO excelMetadataDTO);
}
