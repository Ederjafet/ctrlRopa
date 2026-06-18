package com.hpsqsoft.ctrlropa.company;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public Company getDefaultCompany() {
        return companyRepository.findByCode(Company.DEFAULT_CODE)
                .orElseThrow(() -> new IllegalStateException("Company default no encontrada"));
    }

    public Company findActiveById(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company no encontrada: " + companyId));

        if (!"ACTIVE".equals(company.getStatus())) {
            throw new IllegalStateException("Company inactiva o suspendida: " + company.getCode());
        }

        return company;
    }
}
