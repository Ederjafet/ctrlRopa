package com.hpsqsoft.ctrlropa.company;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CompanyServiceTests {

    private final CompanyRepository repository = mock(CompanyRepository.class);
    private final CompanyService service = new CompanyService(repository);

    @Test
    void defaultCompanyMustExist() {
        Company company = new Company();
        company.setId(1L);
        company.setCode(Company.DEFAULT_CODE);
        company.setName("HPSQ-SOFT Default Company");
        company.setStatus("ACTIVE");

        when(repository.findByCode(Company.DEFAULT_CODE)).thenReturn(Optional.of(company));

        Company result = service.getDefaultCompany();

        assertEquals(1L, result.getId());
        assertEquals(Company.DEFAULT_CODE, result.getCode());
    }

    @Test
    void inactiveCompanyIsRejected() {
        Company company = new Company();
        company.setId(1L);
        company.setCode(Company.DEFAULT_CODE);
        company.setName("HPSQ-SOFT Default Company");
        company.setStatus("SUSPENDED");

        when(repository.findById(1L)).thenReturn(Optional.of(company));

        assertThrows(IllegalStateException.class, () -> service.findActiveById(1L));
    }
}
