package com.algerac.service;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.User;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfGenerationService {
    
    private final ObjectMapper objectMapper;
    private final com.algerac.repository.SatelliteSiteRepository satelliteSiteRepository;
    private static final String ALGERAC_ADDRESS = "ALGERAC - 17 Rue Abdelkader Rakouba, Hussein dey - Alger - Tél : 044.31.74.23/ Fax:044.31.82.20";
    
    /**
     * Génère un PDF complet basé sur le formulaire FOR 20
     */
    public byte[] generateFor20Pdf(User user) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            // Configuration de la police
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");
            
            // En-tête
            addHeader(document, boldFont);
            
            // Section 1: Identification
            addIdentificationSection(document, user, font, boldFont);
            
            // Section 2: Contacts
            addContactsSection(document, user, font, boldFont);
            
            // Section 3: Formations académiques
            addFormationsAcademiquesSection(document, user, font, boldFont);
            
            // Section 3bis: Autres formations
            addAutresFormationsSection(document, user, font, boldFont);
            
            // Nouvelle page pour les sections suivantes
            document.add(new Paragraph("\n").setFontSize(8));
            
            // Section 4: Expérience professionnelle
            addExperienceProfessionnelleSection(document, user, font, boldFont);
            
            // Section 5: Évaluations/Audits
            addEvaluationsAuditsSection(document, user, font, boldFont);
            
            // Section 6: Formations dispensées
            addFormationsDispenseesSection(document, user, font, boldFont);
            
            // Section 7: Connaissances linguistiques
            addConnaissancesLinguistiquesSection(document, user, font, boldFont);
            
            // Section 8: Divers
            addDiversSection(document, user, font, boldFont);
            
            // Pied de page
            addFooter(document, font);
            
            document.close();
            
            log.info("PDF FOR 20 généré avec succès pour {} {}", user.getNom(), user.getPrenom());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF FOR 20", e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
    
    private void addHeader(Document document, PdfFont boldFont) {
        Paragraph header = new Paragraph("CURRICULUM VITAE")
                .setFont(boldFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(header);
        
        Paragraph subHeader = new Paragraph("FOR 20 Rév 03/ 27 – 03 – 2014")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subHeader);
        
        Paragraph address = new Paragraph(ALGERAC_ADDRESS)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(address);
    }
    
    private void addIdentificationSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        // Titre de section
        Paragraph sectionTitle = new Paragraph("1 - IDENTIFICATION")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        // Tableau d'identification (2 colonnes: label et valeur)
        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}));
        table.setWidth(UnitValue.createPercentValue(100));
        
        table.addCell(createCell("ID d'inscription:", boldFont));
        table.addCell(createCell(user.getRegistrationId() != null ? user.getRegistrationId() : "", font));
        
        table.addCell(createCell("Nom:", boldFont));
        table.addCell(createCell(user.getNom() != null ? user.getNom() : "", font));
        
        table.addCell(createCell("Prénom:", boldFont));
        table.addCell(createCell(user.getPrenom() != null ? user.getPrenom() : "", font));
        
        table.addCell(createCell("Date de naissance:", boldFont));
        table.addCell(createCell(user.getDateNaissance() != null ? user.getDateNaissance().toString() : "", font));
        
        table.addCell(createCell("Nationalité:", boldFont));
        table.addCell(createCell(user.getNationalite() != null ? user.getNationalite() : "", font));
        
        table.addCell(createCell("Situation familiale:", boldFont));
        table.addCell(createCell(user.getSituationFamiliale() != null ? user.getSituationFamiliale() : "", font));
        
        table.addCell(createCell("Date d'élaboration:", boldFont));
        table.addCell(createCell(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), font));
        
        document.add(table);
    }
    
    private void addContactsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("2 - CONTACTS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
        table.setWidth(UnitValue.createPercentValue(100));
        
        table.addCell(createCell("Domicile:", boldFont));
        table.addCell(createCell(user.getAdresseDomicile() != null ? user.getAdresseDomicile() : "", font));
        
        table.addCell(createCell("Entreprise:", boldFont));
        table.addCell(createCell(user.getAdresseEntreprise() != null ? user.getAdresseEntreprise() : "", font));
        
        table.addCell(createCell("Téléphone:", boldFont));
        table.addCell(createCell(user.getPhone() != null ? user.getPhone() : "", font));
        
        table.addCell(createCell("Téléphone mobile:", boldFont));
        table.addCell(createCell(user.getTelephoneMobile() != null ? user.getTelephoneMobile() : "", font));
        
        table.addCell(createCell("Fax:", boldFont));
        table.addCell(createCell(user.getFax() != null ? user.getFax() : "", font));
        
        table.addCell(createCell("E-mail:", boldFont));
        table.addCell(createCell(user.getEmail() != null ? user.getEmail() : "", font));
        
        // Contact d'urgence
        document.add(table);
        
        Paragraph urgenceTitle = new Paragraph("Contact d'urgence:")
                .setFont(boldFont)
                .setFontSize(10)
                .setMarginTop(10);
        document.add(urgenceTitle);
        
        Table urgenceTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
        urgenceTable.setWidth(UnitValue.createPercentValue(100));
        
        urgenceTable.addCell(createCell("Nom:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceNom() != null ? user.getContactUrgenceNom() : "", font));
        
        urgenceTable.addCell(createCell("Téléphone:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceTelephone() != null ? user.getContactUrgenceTelephone() : "", font));
        
        urgenceTable.addCell(createCell("Mobile:", boldFont));
        urgenceTable.addCell(createCell(user.getContactUrgenceMobile() != null ? user.getContactUrgenceMobile() : "", font));
        
        document.add(urgenceTable);
    }
    

    private void addFormationsAcademiquesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("3 - FORMATION ACADÉMIQUE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getFormationsAcademiquesJson() != null && !user.getFormationsAcademiquesJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getFormationsAcademiquesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                for (Map<String, Object> formation : formations) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String dateDisplay = !dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        dateDisplay = dateDisplay + " - " + dateFin;
                    }
                    
                    table.addCell(createCell("Date début - Date fin:", boldFont));
                    table.addCell(createCell(dateDisplay, font));
                    
                    table.addCell(createCell("Université / Institution:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("universite")), font));
                    
                    table.addCell(createCell("Cours / Spécialité:", boldFont));
                    String cours = formation.get("cours") != null ? String.valueOf(formation.get("cours")) : "";
                    String specialite = formation.get("specialite") != null ? String.valueOf(formation.get("specialite")) : "";
                    table.addCell(createCell(!cours.isEmpty() && !"null".equals(cours) ? cours : specialite, font));
                    
                    table.addCell(createCell("Diplôme:", boldFont));
                    table.addCell(createCell(String.valueOf(formation.get("diplome")), font));
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations académiques", e);
        }
    }
    
    private void addAutresFormationsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("4 - AUTRES FORMATIONS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getAutresFormationsJson() != null && !user.getAutresFormationsJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getAutresFormationsJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                for (Map<String, Object> formation : formations) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String dateDisplay = (!dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "");
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        dateDisplay = dateDisplay + " - " + dateFin;
                    }
                    
                    table.addCell(createCell("Date début - Date fin:", boldFont));
                    table.addCell(createCell(dateDisplay, font));
                    
                    table.addCell(createCell("Institution / Organisme:", boldFont));
                    String institution = formation.get("institution") != null ? String.valueOf(formation.get("institution")) : "";
                    table.addCell(createCell(!"null".equals(institution) ? institution : "", font));
                    
                    table.addCell(createCell("Cours / Spécialité:", boldFont));
                    String cours = formation.get("cours") != null ? String.valueOf(formation.get("cours")) : "";
                    String specialite = formation.get("specialite") != null ? String.valueOf(formation.get("specialite")) : "";
                    table.addCell(createCell(!cours.isEmpty() && !"null".equals(cours) ? cours : specialite, font));
                    
                    table.addCell(createCell("Certificat / Diplôme:", boldFont));
                    String certificat = formation.get("certificat") != null ? String.valueOf(formation.get("certificat")) : "";
                    table.addCell(createCell(!"null".equals(certificat) ? certificat : "", font));
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des autres formations", e);
        }
    }
    
    private void addExperienceProfessionnelleSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("5 - EXPÉRIENCE PROFESSIONNELLE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getExperiencesProfessionnellesJson() != null && !user.getExperiencesProfessionnellesJson().isEmpty()) {
                List<Map<String, Object>> experiences = objectMapper.readValue(
                    user.getExperiencesProfessionnellesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                for (Map<String, Object> exp : experiences) {
                    Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
                    table.setWidth(UnitValue.createPercentValue(100));
                    table.setMarginBottom(10);
                    
                    table.addCell(createCell("Date (du - au):", boldFont));
                    table.addCell(createCell(exp.get("dateDebut") + " - " + exp.get("dateFin"), font));
                    
                    table.addCell(createCell("Organisme:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("organisme")), font));
                    
                    table.addCell(createCell("Poste occupé:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("poste")), font));
                    
                    table.addCell(createCell("Activités principales:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("activitesPrincipales")), font));
                    
                    table.addCell(createCell("Domaine de compétence:", boldFont));
                    table.addCell(createCell(String.valueOf(exp.get("domaineCompetence")), font));
                    
                    if (exp.containsKey("sousDomaineCompetence") && exp.get("sousDomaineCompetence") != null) {
                        table.addCell(createCell("Sous-domaine:", boldFont));
                        table.addCell(createCell(String.valueOf(exp.get("sousDomaineCompetence")), font));
                    }
                    
                    document.add(table);
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des expériences professionnelles", e);
        }
    }
    
    private void addEvaluationsAuditsSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("6 - ÉVALUATIONS / AUDITS RÉALISÉS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getEvaluationsAuditsJson() != null && !user.getEvaluationsAuditsJson().isEmpty()) {
                List<Map<String, Object>> evaluations = objectMapper.readValue(
                    user.getEvaluationsAuditsJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{10, 15, 20, 20, 35}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Type", boldFont));
                table.addHeaderCell(createCell("Période", boldFont));
                table.addHeaderCell(createCell("Type d'évaluation", boldFont));
                table.addHeaderCell(createCell("Rôle tenu", boldFont));
                table.addHeaderCell(createCell("Normes référentiels", boldFont));
                
                for (Map<String, Object> eval : evaluations) {
                    String type = eval.get("type") != null ? String.valueOf(eval.get("type")) : "";
                    String typeLabel = "evaluation".equals(type) ? "Évaluation" : "audit".equals(type) ? "Audit" : type;
                    table.addCell(createCell(typeLabel, font));
                    String dateDebut = eval.get("dateDebut") != null ? String.valueOf(eval.get("dateDebut")) : "";
                    String dateFin = eval.get("dateFin") != null ? String.valueOf(eval.get("dateFin")) : "";
                    String periode = !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        periode = periode + " - " + dateFin;
                    }
                    table.addCell(createCell(periode, font));
                    table.addCell(createCell(String.valueOf(eval.get("typeEvaluation")), font));
                    table.addCell(createCell(String.valueOf(eval.get("roleTenu")), font));
                    table.addCell(createCell(String.valueOf(eval.get("normesReferentiels")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des évaluations/audits", e);
        }
    }
    
    private void addFormationsDispenseesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("7 - FORMATIONS DISPENSÉES")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        try {
            if (user.getFormationsDispenseesJson() != null && !user.getFormationsDispenseesJson().isEmpty()) {
                List<Map<String, Object>> formations = objectMapper.readValue(
                    user.getFormationsDispenseesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{20, 10, 40, 30}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Période", boldFont));
                table.addHeaderCell(createCell("Durée", boldFont));
                table.addHeaderCell(createCell("Formation", boldFont));
                table.addHeaderCell(createCell("Organisme bénéficiaire", boldFont));
                
                for (Map<String, Object> formation : formations) {
                    String dateDebut = formation.get("dateDebut") != null ? String.valueOf(formation.get("dateDebut")) : "";
                    String dateFin = formation.get("dateFin") != null ? String.valueOf(formation.get("dateFin")) : "";
                    String periode = !dateDebut.isEmpty() && !"null".equals(dateDebut) ? dateDebut : "";
                    if (!dateFin.isEmpty() && !"null".equals(dateFin)) {
                        periode = periode + " - " + dateFin;
                    }
                    table.addCell(createCell(periode, font));
                    String duree = formation.get("duree") != null ? String.valueOf(formation.get("duree")) : "";
                    table.addCell(createCell(!"null".equals(duree) ? duree : "", font));
                    table.addCell(createCell(String.valueOf(formation.get("intituleFormation")), font));
                    String organisme = formation.get("organismeBeneficiaire") != null ? String.valueOf(formation.get("organismeBeneficiaire")) : "";
                    table.addCell(createCell(!"null".equals(organisme) ? organisme : "", font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des formations dispensées", e);
        }
    }
    
    private void addConnaissancesLinguistiquesSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("8 - CONNAISSANCE LINGUISTIQUE")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Paragraph note = new Paragraph("Niveaux : Basique | Assez bien | Bien | Très bien | Excellent")
                .setFontSize(8)
                .setItalic()
                .setMarginBottom(5);
        document.add(note);
        
        try {
            if (user.getConnaissancesLinguistiquesJson() != null && !user.getConnaissancesLinguistiquesJson().isEmpty()) {
                List<Map<String, Object>> langues = objectMapper.readValue(
                    user.getConnaissancesLinguistiquesJson(), 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}));
                table.setWidth(UnitValue.createPercentValue(100));
                
                // En-tête
                table.addHeaderCell(createCell("Langues", boldFont));
                table.addHeaderCell(createCell("Lu", boldFont));
                table.addHeaderCell(createCell("Parlé", boldFont));
                table.addHeaderCell(createCell("Écrit", boldFont));
                
                for (Map<String, Object> langue : langues) {
                    table.addCell(createCell(String.valueOf(langue.get("langue")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauLu")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauParle")), font));
                    table.addCell(createCell(String.valueOf(langue.get("niveauEcrit")), font));
                }
                
                document.add(table);
            }
        } catch (Exception e) {
            log.error("Erreur lors du parsing des connaissances linguistiques", e);
        }
    }
    
    private void addDiversSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("9 - DIVERS")
                .setFont(boldFont)
                .setFontSize(12)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                .setPadding(5)
                .setMarginTop(10);
        document.add(sectionTitle);
        
        Paragraph divers = new Paragraph(user.getInformationsComplementaires() != null ? user.getInformationsComplementaires() : "")
                .setFont(font)
                .setFontSize(10)
                .setMarginTop(5);
        document.add(divers);
    }
    
    private void addFooter(Document document, PdfFont font) {
        Paragraph footer = new Paragraph("Document généré le " + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")))
                .setFont(font)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(footer);
    }
    
    private Cell createCell(String content, PdfFont font) {
        return new Cell()
                .add(new Paragraph(content != null ? content : "").setFont(font).setFontSize(9))
                .setPadding(5);
    }
    
    /**
     * Génère un PDF DOC1 pour les OEC (Organismes d'Évaluation de la Conformité)
     */
    public byte[] generateDoc1Pdf(User user) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            // Configuration de la police
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");
            
            // En-tête du document
            addDoc1Header(document, boldFont);
            
            // Informations de l'organisme
            addOrganismeInfoSection(document, user, font, boldFont);
            
            // Représentant légal
            addRepresentantInfoSection(document, user, font, boldFont);
            
            // Portée d'accréditation
            addPorteeAccreditationSection(document, user, font, boldFont);
            
            // Pied de page
            addFooter(document, font);
            
            document.close();
            
            log.info("PDF DOC1 généré avec succès pour {}", user.getOrganizationName());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF DOC1", e);
            throw new RuntimeException("Erreur lors de la génération du PDF DOC1", e);
        }
    }
    
    private void addDoc1Header(Document document, PdfFont boldFont) {
        // Logo/Titre ALGERAC
        Paragraph logo = new Paragraph("ALGERAC")
                .setFont(boldFont)
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(logo);
        
        Paragraph subtitle = new Paragraph("Association Algérienne pour l'Accréditation")
                .setFont(boldFont)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subtitle);
        
        document.add(new Paragraph("\n"));
        
        // Titre du document
        Paragraph title = new Paragraph("DOC 1 - DEMANDE D'ACCRÉDITATION")
                .setFont(boldFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setBold();
        document.add(title);
        
        Paragraph subtitle2 = new Paragraph("Organisme d'Évaluation de la Conformité")
                .setFont(boldFont)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subtitle2);
        
        document.add(new Paragraph("\n\n"));
    }
    
    private void addOrganismeInfoSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("INFORMATIONS SUR L'ORGANISME")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        // Tableau des informations de l'organisme
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                .useAllAvailableWidth();
        
        table.addCell(createCell("Nom de l'organisme :", boldFont));
        table.addCell(createCell(user.getOrganizationName() != null ? user.getOrganizationName() : "", font));
        
        table.addCell(createCell("Type d'organisme :", boldFont));
        table.addCell(createCell(user.getTypeOrganisme() != null ? user.getTypeOrganisme() : "", font));
        
        table.addCell(createCell("Adresse du siège :", boldFont));
        table.addCell(createCell(user.getAdresseSiege() != null ? user.getAdresseSiege() : "", font));
        
        table.addCell(createCell("Téléphone :", boldFont));
        table.addCell(createCell(user.getPhone() != null ? user.getPhone() : "", font));
        
        table.addCell(createCell("Email :", boldFont));
        table.addCell(createCell(user.getEmail() != null ? user.getEmail() : "", font));
        
        document.add(table);
        document.add(new Paragraph("\n\n"));
    }
    
    private void addRepresentantInfoSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("REPRÉSENTANT LÉGAL")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        // Tableau des informations du représentant
        Table table = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                .useAllAvailableWidth();
        
        table.addCell(createCell("Nom du représentant :", boldFont));
        table.addCell(createCell(user.getNomRepresentant() != null ? user.getNomRepresentant() : "", font));
        
        table.addCell(createCell("Fonction :", boldFont));
        table.addCell(createCell(user.getFonction() != null ? user.getFonction() : "", font));
        
        table.addCell(createCell("Téléphone direct :", boldFont));
        table.addCell(createCell(user.getTelephoneDirect() != null ? user.getTelephoneDirect() : "", font));
        
        table.addCell(createCell("Email professionnel :", boldFont));
        table.addCell(createCell(user.getEmailProfessionnel() != null ? user.getEmailProfessionnel() : "", font));
        
        document.add(table);
        document.add(new Paragraph("\n\n"));
    }
    
    private void addPorteeAccreditationSection(Document document, User user, PdfFont font, PdfFont boldFont) {
        Paragraph sectionTitle = new Paragraph("PORTÉE D'ACCRÉDITATION DEMANDÉE")
                .setFont(boldFont)
                .setFontSize(14)
                .setBold();
        document.add(sectionTitle);
        
        document.add(new Paragraph("\n"));
        
        Paragraph portee = new Paragraph(user.getPorteeAccreditation() != null 
                ? user.getPorteeAccreditation() 
                : "Non spécifiée")
                .setFont(font)
                .setFontSize(11);
        document.add(portee);
        
        document.add(new Paragraph("\n\n"));
        
        // Date de la demande
        Paragraph dateDemande = new Paragraph("Date de la demande : " + 
                (user.getCreatedAt() != null 
                    ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))))
                .setFont(font)
                .setFontSize(10);
        document.add(dateDemande);
        
        document.add(new Paragraph("\n"));
        
        // Adresse ALGERAC
        Paragraph address = new Paragraph(ALGERAC_ADDRESS)
                .setFont(font)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(address);
    }
    
    // =======================================================================
    // Accreditation request PDFs — used to package DOC1 and the technical form
    // (FOR 04 / FOR 05 depending on activities) so DAG, CD, RA, etc. can read
    // the submitted data offline and archive it with the dossier.
    // =======================================================================

    /**
     * Build the DOC1 PDF for a submitted accreditation request. Reads the
     * description JSON blob saved by the OEC's new-request flow and renders
     * the administrative sections.
     */
    public byte[] generateAccreditationDoc1Pdf(AccreditationRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont bold = PdfFontFactory.createFont("Helvetica-Bold");

            addOecLogo(document, request);
            document.add(new Paragraph("ALGERAC — DOC 1").setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Demande d'accréditation").setFont(bold).setFontSize(12).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(" "));

            String refLabel = request.getReferenceNumber();
            if (refLabel == null || refLabel.isBlank()) {
                refLabel = request.getSequenceNumber() != null ? ("Séq. #" + request.getSequenceNumber()) : ("Dossier #" + request.getId());
            }
            document.add(new Paragraph("Référence : " + refLabel).setFont(bold));
            if (request.getSubmissionDate() != null) {
                document.add(new Paragraph("Date de soumission : " + request.getSubmissionDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).setFont(font));
            }
            document.add(new Paragraph(" "));

            renderDoc1Body(document, request, font, bold);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF DOC1 pour la demande #{}", request.getId(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF DOC1 d'accréditation", e);
        }
    }

    /**
     * Build the technical form PDF (FOR 04 for inspection, FOR 05 for essais,
     * FOR 06 for étalonnage, etc.) based on the activities declared by the OEC.
     * Multiple activities produce multiple sections in a single document.
     */
    public byte[] generateAccreditationTechnicalFormPdf(AccreditationRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont bold = PdfFontFactory.createFont("Helvetica-Bold");

            Map<String, Object> body = technicalBody(request);
            List<String> activites = listOf(body.get("activites"));

            document.add(new Paragraph("ALGERAC — Formulaires techniques").setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER));
            String refLabel = request.getReferenceNumber();
            if (refLabel == null || refLabel.isBlank()) {
                refLabel = request.getSequenceNumber() != null ? ("Séq. #" + request.getSequenceNumber()) : ("Dossier #" + request.getId());
            }
            document.add(new Paragraph("Dossier : " + refLabel).setFont(font).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(" "));

            if (activites.isEmpty()) {
                document.add(new Paragraph("Aucune activité déclarée.").setFont(font));
            }
            if (activites.contains("inspection")) {
                document.add(new Paragraph("FOR 04 — Inspection (ISO/IEC 17020)").setFont(bold).setFontSize(12));
                keyValueTable(document, font, bold, new String[][]{{"Type d'organisme", str(body.get("for04Type"))}});
                renderTableIfAny(document, body.get("for04Domaines"), "Domaines d'inspection", font, bold);
                renderTableIfAny(document, body.get("for04Inspecteurs"), "Personnel d'inspection", font, bold);
                renderTableIfAny(document, body.get("for04Equipements"), "Équipements", font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("essais")) {
                document.add(new Paragraph("FOR 05 — Essais (ISO/IEC 17025)").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for05Domaines"), "Portée d'accréditation", font, bold);
                renderTableIfAny(document, body.get("for05Methodes"), "Méthodes", font, bold);
                renderTableIfAny(document, body.get("for05Equipements"), "Équipements", font, bold);
                renderTableIfAny(document, body.get("for05Personnel"), "Personnel", font, bold);
                keyValueTable(document, font, bold, new String[][]{
                        {"Participation EIL", str(body.get("for05ParticipationEIL"))},
                        {"Procédure incertitudes", str(body.get("for05ProcedureIncertitudes"))}});
                document.add(new Paragraph(" "));
            }
            if (activites.contains("etalonnage")) {
                document.add(new Paragraph("FOR 06 — Étalonnage (ISO/IEC 17025)").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for06Grandeurs"), "Grandeurs et gammes", font, bold);
                renderTableIfAny(document, body.get("for06Etalons"), "Étalons de référence", font, bold);
                renderTableIfAny(document, body.get("for06Equipements"), "Équipements", font, bold);
                renderTableIfAny(document, body.get("for06Personnel"), "Personnel", font, bold);
                keyValueTable(document, font, bold, new String[][]{{"Conditions environnementales", str(body.get("for06ConditionsEnv"))}});
                document.add(new Paragraph(" "));
            }
            if (activites.contains("cert_sm")) {
                document.add(new Paragraph("FOR 07 — Certification SM").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for07Secteurs"), "Secteurs IAF", font, bold);
                renderTableIfAny(document, body.get("for07Auditeurs"), "Auditeurs", font, bold);
                renderTableIfAny(document, body.get("for07Comite"), "Comité de décision", font, bold);
                keyValueTable(document, font, bold, new String[][]{
                        {"Référentiels", joinList(body.get("for07Referentiels"))},
                        {"Nombre de clients certifiés", str(body.get("for07NbClientsCertifies"))}});
                document.add(new Paragraph(" "));
            }
            if (activites.contains("examens_medicaux")) {
                document.add(new Paragraph("FOR 05-1 — Biologie médicale").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for051Disciplines"), "Disciplines", font, bold);
                renderTableIfAny(document, body.get("for051Personnel"), "Personnel", font, bold);
                keyValueTable(document, font, bold, new String[][]{{"Participation EEQ", str(body.get("for051ParticipationEEQ"))}});
                document.add(new Paragraph(" "));
            }
            if (activites.contains("essais_aptitude")) {
                document.add(new Paragraph("FOR 05-5 — Essais d'aptitude").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for055Programmes"), "Programmes", font, bold);
                renderTableIfAny(document, body.get("for055Personnel"), "Personnel", font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("cert_produits")) {
                document.add(new Paragraph("FOR 07-5 — Certification produits, procédés et services").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for075Produits"), "Produits", font, bold);
                renderTableIfAny(document, body.get("for075Evaluateurs"), "Évaluateurs", font, bold);
                document.add(new Paragraph(" "));
            }
            if (activites.contains("cert_personnes")) {
                document.add(new Paragraph("FOR 07-8 — Certification de personnes").setFont(bold).setFontSize(12));
                renderTableIfAny(document, body.get("for078Schemas"), "Schémas", font, bold);
                renderTableIfAny(document, body.get("for078Evaluateurs"), "Évaluateurs", font, bold);
                document.add(new Paragraph(" "));
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF technique pour la demande #{}", request.getId(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF technique", e);
        }
    }

    // ---- DOC1 rendering ----------------------------------------------------

    /** DOC1 map plus the nested technicalForms.* sections flattened to the for04Type / for05Domaines... keys. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> technicalBody(AccreditationRequest request) {
        Map<String, Object> body = new java.util.LinkedHashMap<>(doc1Body(request));
        if (body.get("technicalForms") instanceof Map<?, ?> forms) {
            String[][] mapping = {
                    {"for04", "typeOrganisme", "for04Type"}, {"for04", "domaines", "for04Domaines"},
                    {"for04", "inspecteurs", "for04Inspecteurs"}, {"for04", "equipements", "for04Equipements"},
                    {"for05", "domaines", "for05Domaines"}, {"for05", "methodes", "for05Methodes"},
                    {"for05", "equipements", "for05Equipements"}, {"for05", "personnel", "for05Personnel"},
                    {"for05", "participationEIL", "for05ParticipationEIL"},
                    {"for05", "procedureIncertitudes", "for05ProcedureIncertitudes"},
                    {"for06", "grandeurs", "for06Grandeurs"}, {"for06", "etalons", "for06Etalons"},
                    {"for06", "equipements", "for06Equipements"}, {"for06", "personnel", "for06Personnel"},
                    {"for06", "conditionsEnvironnementales", "for06ConditionsEnv"},
                    {"for07", "referentiels", "for07Referentiels"}, {"for07", "secteurs", "for07Secteurs"},
                    {"for07", "auditeurs", "for07Auditeurs"}, {"for07", "comite", "for07Comite"},
                    {"for07", "nbClientsCertifies", "for07NbClientsCertifies"},
                    {"for051", "disciplines", "for051Disciplines"}, {"for051", "personnel", "for051Personnel"},
                    {"for051", "participationEEQ", "for051ParticipationEEQ"},
                    {"for055", "programmes", "for055Programmes"}, {"for055", "personnel", "for055Personnel"},
                    {"for075", "produits", "for075Produits"}, {"for075", "evaluateurs", "for075Evaluateurs"},
                    {"for078", "schemas", "for078Schemas"}, {"for078", "evaluateurs", "for078Evaluateurs"},
            };
            for (String[] m : mapping) {
                if (forms.get(m[0]) instanceof Map<?, ?> form && form.get(m[1]) != null) {
                    body.put(m[2], form.get(m[1]));
                }
            }
        }
        return body;
    }

    private static final Map<String, String> DOC1_TYPES_DEMANDE = Map.of(
            "initiale", "Accréditation initiale", "extension", "Extension",
            "renouvellement", "Renouvellement", "transfert", "Transfert");

    private static final Map<String, String> DOC1_ACTIVITES = Map.of(
            "inspection", "Inspection", "essais", "Essais", "etalonnage", "Étalonnage",
            "examens_medicaux", "Examens médicaux", "essais_aptitude", "Essais d'aptitude",
            "cert_sm", "Certification SM",
            "cert_produits", "Certification produits/procédés/services",
            "cert_personnes", "Certification personnes");

    private static final Map<String, String> DOC1_PRESTATION_TYPES = Map.of(
            "accompagnement", "Accompagnement", "formation", "Formation",
            "audit_interne", "Audit interne", "autre", "Autre");

    // PRO 26 §5.1 qualification criteria, in form order
    private static final String[][] DOC1_MS_CRITERIA = {
            {"legalLink", "Lien juridique entre les sites et le siège"},
            {"centralSM", "Système de management centralisé"},
            {"commonSM", "Système de management commun à tous les sites"},
            {"internalAudit", "Programme d'audit interne couvrant tous les sites"},
            {"centralMgmt", "Gestion centralisée (revue de direction, ressources)"},
            {"dataCapacity", "Capacité de collecte et d'analyse des données de tous les sites"},
    };

    private void addOecLogo(Document document, AccreditationRequest request) {
        try {
            User oec = request.getOec();
            if (oec == null || oec.getLogoBase64() == null || oec.getLogoBase64().isBlank()) return;
            String mime = oec.getLogoMimeType();
            // iText cannot embed SVG as a raster image
            if (mime == null || mime.contains("svg")) return;
            Image img = new Image(ImageDataFactory.create(java.util.Base64.getDecoder().decode(oec.getLogoBase64())));
            img.scaleToFit(120, 60);
            img.setHorizontalAlignment(HorizontalAlignment.CENTER);
            document.add(img);
        } catch (Exception e) {
            log.warn("Logo OEC ignoré dans le DOC1 de la demande #{} : {}", request.getId(), e.getMessage());
        }
    }

    private void putIfBlank(Map<String, Object> map, String key, Object value) {
        Object current = map.get(key);
        if ((current == null || String.valueOf(current).isBlank()) && value != null) {
            map.put(key, value);
        }
    }

    /**
     * Flatten the stored description into one DOC1 map. The public OEC registration wraps the
     * form as {type, domain, description:{...}, multisite:{...}} while the new-request flow stores
     * the form directly; multisite data of the new-request flow only lives on the request entity.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> doc1Body(AccreditationRequest request) {
        Map<String, Object> raw = parseDescription(request.getDescription());
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        if (raw.get("description") instanceof Map<?, ?> inner) {
            body.putAll((Map<String, Object>) inner);
            if (raw.get("multisite") instanceof Map<?, ?> ms) {
                putIfBlank(body, "msMainSiteName", ms.get("mainSiteName"));
                putIfBlank(body, "msMainSiteAddress", ms.get("mainSiteAddress"));
                putIfBlank(body, "msMainSiteContactName", ms.get("mainSiteContactName"));
                putIfBlank(body, "msMainSiteContactEmail", ms.get("mainSiteContactEmail"));
                putIfBlank(body, "msCentralizedSM", ms.get("centralizedManagementSystem"));
                putIfBlank(body, "msSMDescription", ms.get("managementSystemDescription"));
                putIfBlank(body, "msInterSiteExchangesDoc", ms.get("interSiteExchangesDoc"));
                putIfBlank(body, "msCriteriaJson", ms.get("qualificationCriteriaJson"));
                putIfBlank(body, "satelliteSites", ms.get("satelliteSites"));
            }
        } else {
            body.putAll(raw);
        }

        if (Boolean.TRUE.equals(request.getIsMultisite())) {
            putIfBlank(body, "siteType", "multisites");
            putIfBlank(body, "msMainSiteName", request.getMainSiteName());
            putIfBlank(body, "msMainSiteAddress", request.getMainSiteAddress());
            putIfBlank(body, "msMainSiteContactName", request.getMainSiteContactName());
            putIfBlank(body, "msMainSiteContactEmail", request.getMainSiteContactEmail());
            putIfBlank(body, "msCentralizedSM", request.getCentralizedManagementSystem());
            putIfBlank(body, "msSMDescription", request.getManagementSystemDescription());
            putIfBlank(body, "msInterSiteExchangesDoc", request.getInterSiteExchangesDoc());
            putIfBlank(body, "msCriteriaJson", request.getQualificationCriteriaJson());
            boolean hasSatellites = body.get("satelliteSites") instanceof List<?> l && !l.isEmpty();
            if (!hasSatellites && request.getId() != null) {
                List<Map<String, Object>> satellites = new java.util.ArrayList<>();
                for (com.algerac.model.SatelliteSite s : satelliteSiteRepository.findByRequest_IdOrderByIdAsc(request.getId())) {
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("name", s.getName());
                    row.put("address", s.getAddress());
                    row.put("activities", s.getActivities());
                    row.put("personnel", s.getPersonnel());
                    row.put("isInScope", s.getIsInScope());
                    satellites.add(row);
                }
                if (!satellites.isEmpty()) body.put("satelliteSites", satellites);
            }
        }
        return body;
    }

    private String doc1Fmt(Object value) {
        if (value == null) return "";
        if (value instanceof Boolean b) return b ? "Oui" : "Non";
        if (value instanceof List<?> l) {
            return l.stream().map(this::doc1Fmt).filter(s -> !s.isBlank()).collect(java.util.stream.Collectors.joining(", "));
        }
        return value.toString().trim();
    }

    private String doc1Date(Object value) {
        String s = doc1Fmt(value);
        try {
            return java.time.LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s)
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            return s;
        }
    }

    private void doc1Section(Document document, String title, PdfFont bold) {
        document.add(new Paragraph(title).setFont(bold).setFontSize(11).setMarginTop(10).setMarginBottom(3));
    }

    private Table doc1Table() {
        return new Table(UnitValue.createPercentArray(new float[]{3f, 7f})).useAllAvailableWidth();
    }

    /** Renders the rows with the given {key, label} columns; rows with no filled column are skipped. */
    private void doc1Rows(Document document, List<Map<String, Object>> rows, String title, String[][] cols,
                          PdfFont font, PdfFont bold) {
        List<Map<String, Object>> filled = new java.util.ArrayList<>();
        for (Map<String, Object> r : rows) {
            for (String[] c : cols) {
                if (!doc1Fmt(r.get(c[0])).isBlank()) { filled.add(r); break; }
            }
        }
        if (filled.isEmpty()) return;
        if (title != null) document.add(new Paragraph(title).setFont(bold).setFontSize(10).setMarginTop(6));
        float[] widths = new float[cols.length];
        java.util.Arrays.fill(widths, 1f);
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        for (String[] c : cols) table.addHeaderCell(createCell(c[1], bold));
        for (Map<String, Object> r : filled) {
            for (String[] c : cols) {
                String v = doc1Fmt(r.get(c[0]));
                table.addCell(createCell(v.isBlank() ? "—" : v, font));
            }
        }
        document.add(table);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> doc1List(Object raw) {
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        if (raw instanceof List<?> l) {
            for (Object o : l) if (o instanceof Map<?, ?> m) out.add((Map<String, Object>) m);
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private void renderDoc1Body(Document document, AccreditationRequest request, PdfFont font, PdfFont bold) {
        Map<String, Object> body = doc1Body(request);
        User oec = request.getOec();

        // 1. Type de demande
        doc1Section(document, "1. Type de demande", bold);
        Table t = doc1Table();
        String typeDemande = str(body.get("typeDemande"));
        addDoc1Row(t, "Type de demande", DOC1_TYPES_DEMANDE.getOrDefault(typeDemande, typeDemande), font, bold);
        String siteType = str(body.get("siteType"));
        // Helvetica has no ballot-box glyphs, so plain-text boxes are used
        String monoBox = "monosite".equalsIgnoreCase(siteType) ? "[X]" : "[  ]";
        String multiBox = "multisites".equalsIgnoreCase(siteType) ? "[X]" : "[  ]";
        Cell siteCell = new Cell(1, 2).setPadding(4).setMarginBottom(2);
        siteCell.add(new Paragraph("L\u2019activit\u00e9 est r\u00e9alis\u00e9e sur un monosite " + monoBox + " ou un multisites " + multiBox)
                .setFont(bold).setFontSize(10));
        siteCell.add(new Paragraph("(Si multisites, pri\u00e8re de renseigner le formulaire de renseignement technique de l\u2019activit\u00e9 concern\u00e9e pour chaque site)")
                .setFont(font).setFontSize(9).setItalic());
        t.addCell(siteCell);
        List<String> activites = listOf(body.get("activites")).stream()
                .map(a -> DOC1_ACTIVITES.getOrDefault(a, a)).toList();
        addDoc1Row(t, "Types d'activités", String.join(", ", activites), font, bold);
        addDoc1Row(t, "Date d'évaluation souhaitée", doc1Date(body.get("dateEvaluation")), font, bold);
        if ("transfert".equalsIgnoreCase(typeDemande)) {
            addDoc1Row(t, "Motif de transfert", str(body.get("motifTransfert")), font, bold);
        }
        document.add(t);

        // 2. Organisme
        doc1Section(document, "2. Informations sur l'organisme", bold);
        t = doc1Table();
        addDoc1Row(t, "Dénomination légale", str(body.get("nomLegal")), font, bold);
        addDoc1Row(t, "Abréviation", str(body.get("abreviation")), font, bold);
        addDoc1Row(t, "Statut juridique", str(body.get("statutJuridique")), font, bold);
        addDoc1Row(t, "N° registre du commerce", str(body.get("registreCommerce")), font, bold);
        addDoc1Row(t, "Codes activité", str(body.get("codesActivite")), font, bold);
        addDoc1Row(t, "Adresse du siège", str(body.get("adresseSiege")), font, bold);
        addDoc1Row(t, "Adresse de facturation", str(body.get("adresseFacturation")), font, bold);
        addDoc1Row(t, "Email de l'organisme", str(body.get("emailOrg")), font, bold);
        addDoc1Row(t, "Site web", str(body.get("siteWeb")), font, bold);
        boolean inGroup = "oui".equalsIgnoreCase(str(body.get("appartientGroupe")));
        addDoc1Row(t, "Appartient à un groupe", inGroup ? "Oui" : "Non", font, bold);
        if (inGroup) {
            addDoc1Row(t, "Nom du groupe", str(body.get("groupeNom")), font, bold);
            addDoc1Row(t, "Adresse du groupe", str(body.get("groupeAdresse")), font, bold);
            // groupeImpact only exists on requests submitted before the two fields were merged
            addDoc1Row(t, "Relation avec le groupe (interventions du groupe dans l'activité)",
                    (str(body.get("groupeRelation")) + " " + str(body.get("groupeImpact"))).trim(), font, bold);
        }
        document.add(t);

        // 3. Personne à contacter
        doc1Section(document, "3. Personne à contacter", bold);
        t = doc1Table();
        addDoc1Row(t, "Nom complet", str(body.get("contactNom")), font, bold);
        addDoc1Row(t, "Fonction", str(body.get("contactFonction")), font, bold);
        addDoc1Row(t, "Adresse", str(body.get("contactAdresse")), font, bold);
        addDoc1Row(t, "Téléphone", str(body.get("contactTelephone")), font, bold);
        addDoc1Row(t, "Fax", str(body.get("contactFax")), font, bold);
        addDoc1Row(t, "Email", str(body.get("contactEmail")), font, bold);
        document.add(t);

        // 4. Sites
        if ("multisites".equalsIgnoreCase(siteType)) {
            doc1Section(document, "4. Sites — configuration multisites (PRO 26)", bold);
            t = doc1Table();
            addDoc1Row(t, "Siège central — nom", str(body.get("msMainSiteName")), font, bold);
            addDoc1Row(t, "Siège central — adresse", str(body.get("msMainSiteAddress")), font, bold);
            addDoc1Row(t, "Contact siège — nom", str(body.get("msMainSiteContactName")), font, bold);
            addDoc1Row(t, "Contact siège — email", str(body.get("msMainSiteContactEmail")), font, bold);
            addDoc1Row(t, "Système de management centralisé", doc1Fmt(body.get("msCentralizedSM")), font, bold);
            addDoc1Row(t, "Description du système de management", str(body.get("msSMDescription")), font, bold);
            addDoc1Row(t, "Document d'échanges inter-sites", str(body.get("msInterSiteExchangesDoc")), font, bold);
            document.add(t);
            doc1Rows(document, doc1List(body.get("satelliteSites")), "Sites satellites", new String[][]{
                    {"name", "Nom"}, {"address", "Adresse"}, {"activities", "Activités"},
                    {"personnel", "Personnel"}, {"isInScope", "Dans la portée"}}, font, bold);
            renderDoc1Criteria(document, str(body.get("msCriteriaJson")), font, bold);
        } else {
            doc1Section(document, "4. Site unique", bold);
            List<Map<String, Object>> sites = doc1List(body.get("sites"));
            if (!sites.isEmpty()) {
                Map<String, Object> site = sites.get(0);
                t = doc1Table();
                addDoc1Row(t, "Adresse", str(site.get("adresse")), font, bold);
                addDoc1Row(t, "Activités réalisées", str(site.get("activites")), font, bold);
                addDoc1Row(t, "Sous-traitance", str(site.get("soustraitance")), font, bold);
                document.add(t);
            }
        }

        // 5. Personnel
        doc1Section(document, "5. Personnel", bold);
        doc1Rows(document, doc1List(body.get("personnelSites")), "Personnel par site", new String[][]{
                {"site", "Site"}, {"permanents", "Permanents"}, {"vacataires", "Vacataires"}}, font, bold);
        doc1Rows(document, doc1List(body.get("responsablesTechniques")), "Responsables techniques", new String[][]{
                {"nom", "Nom"}, {"qualifications", "Qualifications"}, {"experience", "Expérience (ans)"}}, font, bold);
        String rqNom = str(body.get("responsableQualiteNom"));
        String rqDiplomes = str(body.get("responsableQualiteQualif"));
        String rqExp = str(body.get("responsableQualiteExp"));
        if (!rqNom.isBlank() || !rqDiplomes.isBlank() || !rqExp.isBlank()) {
            document.add(new Paragraph("Responsable qualité (cas échéant)").setFont(bold).setFontSize(10).setMarginTop(6));
            t = doc1Table();
            addDoc1Row(t, "Nom complet", rqNom, font, bold);
            addDoc1Row(t, "Diplômes", rqDiplomes, font, bold);
            addDoc1Row(t, "Années d'expérience", rqExp, font, bold);
            document.add(t);
        }

        // 6. Prestations externes
        String prestationConseil = str(body.get("prestationConseil"));
        if (!prestationConseil.isBlank()) {
            doc1Section(document, "6. Prestations externes", bold);
            t = doc1Table();
            addDoc1Row(t, "Avez-vous bénéficié de prestations externes ?", "oui".equalsIgnoreCase(prestationConseil) ? "Oui" : "Non", font, bold);
            document.add(t);
            if ("oui".equalsIgnoreCase(prestationConseil)) {
                List<Map<String, Object>> prestations = new java.util.ArrayList<>();
                for (Map<String, Object> p : doc1List(body.get("prestations"))) {
                    Map<String, Object> row = new java.util.LinkedHashMap<>(p);
                    row.put("types", listOf(p.get("types")).stream()
                            .map(ty -> DOC1_PRESTATION_TYPES.getOrDefault(ty, ty)).toList());
                    row.put("date", doc1Date(p.get("date")));
                    prestations.add(row);
                }
                doc1Rows(document, prestations, null, new String[][]{
                        {"types", "Types"}, {"autrePrecision", "Précision"}, {"prestataire", "Prestataire"},
                        {"date", "Date"}, {"description", "Description"}}, font, bold);
            }
        }

        // 7. Reconnaissances / Agréments
        List<Map<String, Object>> reconnaissances = doc1List(body.get("reconnaissances"));
        doc1Section(document, "7. Reconnaissances / Agréments", bold);
        if (reconnaissances.stream().anyMatch(r -> !doc1Fmt(r.get("organisation")).isBlank()
                || !doc1Fmt(r.get("domaine")).isBlank() || !doc1Fmt(r.get("validite")).isBlank())) {
            doc1Rows(document, reconnaissances, null, new String[][]{
                    {"organisation", "Organisme d'accréditation"}, {"domaine", "Domaine"}, {"validite", "Date de validité"}}, font, bold);
        } else {
            document.add(new Paragraph("Aucune.").setFont(font).setFontSize(9));
        }

        // 8. Pièces jointes (names only, never the encoded content)
        List<Map<String, Object>> documents = new java.util.ArrayList<>();
        for (Map<String, Object> d : doc1List(body.get("documents"))) {
            String key = str(d.get("key"));
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("document", key.startsWith("admin-") ? key.substring(6) : key);
            String fileName = str(d.get("name"));
            row.put("fichier", fileName.equals(row.get("document")) ? "Non joint" : fileName);
            documents.add(row);
        }
        if (!documents.isEmpty()) {
            doc1Section(document, "8. Documents joints", bold);
            doc1Rows(document, documents, null, new String[][]{{"document", "Document"}, {"fichier", "Fichier"}}, font, bold);
        }

        // 9. Déclaration
        doc1Section(document, "9. Déclaration", bold);
        document.add(new Paragraph("Je déclare que les informations fournies sont exactes et complètes.").setFont(font).setFontSize(9));
        document.add(new Paragraph("Je m'engage à :").setFont(bold).setFontSize(9));
        document.add(new Paragraph("- informer ALGERAC de tout changement affectant la portée d'accréditation ;").setFont(font).setFontSize(9));
        document.add(new Paragraph("- transmettre tous les documents complémentaires demandés ;").setFont(font).setFontSize(9));
        document.add(new Paragraph("- respecter les normes et règlements en vigueur ainsi que les procédures ALGERAC.").setFont(font).setFontSize(9));
        document.add(new Paragraph("Je reconnais avoir pris connaissance des droits et obligations liés à l'accréditation.").setFont(font).setFontSize(9));
        String organisme = str(body.get("organismeSoumission"));
        if (organisme.isBlank()) organisme = str(body.get("nomLegal"));
        if (organisme.isBlank() && oec != null) organisme = str(oec.getOrganizationName());
        document.add(new Paragraph("Je certifie être dûment autorisé par l'organisme « " + organisme + " » à soumettre la présente demande.")
                .setFont(font).setFontSize(9));
        t = doc1Table();
        addDoc1Row(t, "Demandeur", str(body.get("demandeurNom")), font, bold);
        addDoc1Row(t, "Fonction", str(body.get("demandeurFonction")), font, bold);
        addDoc1Row(t, "Date", doc1Date(body.get("demandeurDate")), font, bold);
        document.add(t);
    }

    private void renderDoc1Criteria(Document document, String criteriaJson, PdfFont font, PdfFont bold) {
        if (criteriaJson == null || criteriaJson.isBlank()) return;
        try {
            Map<String, Map<String, Object>> criteria = objectMapper.readValue(
                    criteriaJson, new TypeReference<Map<String, Map<String, Object>>>() {});
            List<Map<String, Object>> rows = new java.util.ArrayList<>();
            for (String[] c : DOC1_MS_CRITERIA) {
                Map<String, Object> entry = criteria.get(c[0]);
                if (entry == null) continue;
                Map<String, Object> row = new java.util.LinkedHashMap<>();
                row.put("critere", c[1]);
                row.put("satisfait", Boolean.TRUE.equals(entry.get("checked")));
                row.put("justification", entry.get("justification"));
                rows.add(row);
            }
            doc1Rows(document, rows, "Critères de qualification des sites (PRO 26 §5.1)", new String[][]{
                    {"critere", "Critère"}, {"satisfait", "Satisfait"}, {"justification", "Justification"}}, font, bold);
        } catch (Exception e) {
            log.warn("Critères multisites illisibles dans le DOC1 : {}", e.getMessage());
        }
    }

    // ---- Helpers -----------------------------------------------------------

    /** Rows must be filled before the table is added to the document, otherwise iText drops them. */
    private void keyValueTable(Document document, PdfFont font, PdfFont bold, String[][] rows) {
        Table tbl = doc1Table();
        for (String[] r : rows) addDoc1Row(tbl, r[0], r[1], font, bold);
        document.add(tbl);
    }

    private void addDoc1Row(Table t, String label, String value, PdfFont font, PdfFont bold) {
        t.addCell(createCell(label, bold));
        t.addCell(createCell(value == null || value.isBlank() ? "—" : value, font));
    }

    private Map<String, Object> parseDescription(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("_raw", json);
        }
    }

    private String str(Object o) {
        return o == null ? "" : o.toString();
    }

    private List<String> listOf(Object raw) {
        if (raw instanceof List<?> l) {
            return l.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private String joinList(Object raw) {
        List<String> l = listOf(raw);
        return l.isEmpty() ? "" : String.join(", ", l);
    }

    /** "sousDomaine" -> "Sous domaine" */
    private String humanizeKey(String key) {
        String spaced = key.replaceAll("([a-z0-9])([A-Z])", "$1 $2").toLowerCase();
        return spaced.isEmpty() ? spaced : Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }

    @SuppressWarnings("unchecked")
    private void renderTableIfAny(Document doc, Object raw, String title, PdfFont font, PdfFont bold) {
        if (!(raw instanceof List<?> rows) || rows.isEmpty()) return;
        List<Map<String, Object>> typed = new java.util.ArrayList<>();
        for (Object r : rows) {
            if (r instanceof Map<?, ?> m) typed.add((Map<String, Object>) m);
        }
        if (typed.isEmpty()) return;

        // Collect column keys preserving insertion order, ignoring internal "id"
        java.util.LinkedHashSet<String> cols = new java.util.LinkedHashSet<>();
        for (Map<String, Object> r : typed) {
            for (String k : r.keySet()) if (!"id".equals(k)) cols.add(k);
        }
        if (cols.isEmpty()) return;

        doc.add(new Paragraph(title).setFont(bold).setFontSize(11));
        float[] widths = new float[cols.size()];
        java.util.Arrays.fill(widths, 1f);
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        for (String c : cols) table.addHeaderCell(createCell(humanizeKey(c), bold));
        for (Map<String, Object> r : typed) {
            for (String c : cols) table.addCell(createCell(doc1Fmt(r.get(c)), font));
        }
        doc.add(table);
        doc.add(new Paragraph(" "));
    }

    // ============================================================
    // DEVIS ESTIMATIF (FOR 44 / FOR 44-1 / FOR 44-2)
    // ============================================================

    private static final java.math.BigDecimal TVA_RATE = new java.math.BigDecimal("0.19");
    private static final java.text.NumberFormat DA_FMT;
    static {
        java.text.DecimalFormatSymbols sym = new java.text.DecimalFormatSymbols(java.util.Locale.FRENCH);
        sym.setGroupingSeparator(' ');
        sym.setDecimalSeparator(',');
        DA_FMT = new java.text.DecimalFormat("#,##0.00", sym);
    }

    public byte[] generateDevisEstimatifPdf(com.algerac.model.Quotation quotation) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            document.setMargins(28, 28, 28, 28);

            PdfFont font = PdfFontFactory.createFont("Helvetica");
            PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");

            com.algerac.model.AccreditationRequest request = quotation.getRequest();
            com.algerac.model.RequestType type = request != null ? request.getType() : com.algerac.model.RequestType.INITIAL;

            String formCode;
            String mainTitle;
            String subTitle;
            switch (type) {
                case SURVEILLANCE -> {
                    formCode = "FOR 44-1 Rév 04/23-01-2017";
                    mainTitle = "Devis estimatif de l'évaluation de surveillance dans le cadre de l'accréditation";
                    subTitle = "Coûts évalués de l'évaluation de Surveillance de l'Accréditation d'un organisme d'évaluation de la conformité - OEC -\n(Laboratoire, Organisme d'inspection ou certificateur)";
                }
                case EXTENSION -> {
                    formCode = "FOR 44-2 Rév 04/23-01-2017";
                    mainTitle = "Devis estimatif de l'extension dans le cadre de l'accréditation";
                    subTitle = "Coûts évalués de l'extension de l'Accréditation d'un organisme d'évaluation de la conformité - OEC\n(Laboratoire, Organisme d'inspection ou certificateur)";
                }
                default -> {
                    formCode = "FOR 44 Rév 04/17-10-2016";
                    mainTitle = "Devis estimatif de l'accréditation initiale ou de renouvellement dans le cadre de l'accréditation";
                    subTitle = "Coûts évalués de l'Accréditation initiale ou de renouvellement d'un organisme d'évaluation de la\nconformité - OEC (Laboratoire, Organisme d'inspection ou certificateur)";
                }
            }

            // ── Bandeau d'en-tête (titre + référence formulaire) ──
            Table headerBar = new Table(UnitValue.createPercentArray(new float[]{80, 20})).useAllAvailableWidth();
            headerBar.addCell(new Cell().add(new Paragraph(mainTitle).setFont(boldFont).setFontSize(10))
                    .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(220, 230, 245))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4));
            headerBar.addCell(new Cell().add(new Paragraph("Page : 1/1").setFont(font).setFontSize(9).setTextAlignment(TextAlignment.RIGHT))
                    .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(220, 230, 245))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4));
            document.add(headerBar);
            document.add(new Paragraph(formCode).setFont(font).setFontSize(8).setMarginBottom(6));

            // ── Sous-titre + ALGERAC ──
            document.add(new Paragraph(subTitle)
                    .setFont(font).setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginTop(4));
            document.add(new Paragraph("ALGERAC")
                    .setFont(boldFont).setFontSize(13).setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));

            // ── Bloc Devis N° / Date ──
            String devisNumber = quotation.getDevisEstimatifNumber() != null
                    ? quotation.getDevisEstimatifNumber()
                    : (quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() : "");
            String devisDate = quotation.getDevisEstimatifDate() != null
                    ? quotation.getDevisEstimatifDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : (quotation.getApprovedByDagDate() != null
                        ? quotation.getApprovedByDagDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            Table titleRow = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            titleRow.addCell(new Cell().add(new Paragraph("Devis Estimatif N° : " + devisNumber).setFont(boldFont).setFontSize(11))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(2));
            titleRow.addCell(new Cell().add(new Paragraph("Date devis : " + devisDate).setFont(boldFont).setFontSize(11))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(2));
            document.add(titleRow);

            // Boîtes Organisme / Site
            String orgLabel = (type == com.algerac.model.RequestType.INITIAL) ? "Sigle Organisme:" : "Raison sociale Organisme:";
            String orgName = "";
            String orgAddress = "";
            if (request != null && request.getOecForJson() != null) {
                var dto = request.getOecForJson();
                orgName = dto.getOrganizationName() != null ? dto.getOrganizationName() : (dto.getFullName() != null ? dto.getFullName() : "");
            }
            String dossier = request != null && request.getReferenceNumber() != null ? request.getReferenceNumber() : "";
            String siteName = quotation.getSiteName() != null ? quotation.getSiteName() : "";
            String siteAddress = quotation.getSiteAddress() != null ? quotation.getSiteAddress() : "";

            Table boxes = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            Cell leftBox = new Cell().setPadding(6)
                    .add(new Paragraph(orgLabel + " " + orgName).setFont(font).setFontSize(10).setMarginBottom(4))
                    .add(new Paragraph("Nom Organisme : " + orgName).setFont(font).setFontSize(10).setMarginBottom(4))
                    .add(new Paragraph("Adresse Organisme : " + orgAddress).setFont(font).setFontSize(10).setMarginBottom(4))
                    .add(new Paragraph("Dossier N° : " + dossier).setFont(font).setFontSize(10));
            Cell rightBox = new Cell().setPadding(6)
                    .add(new Paragraph("Nom Site : " + siteName).setFont(font).setFontSize(10).setMarginBottom(4))
                    .add(new Paragraph("Adresse site : " + siteAddress).setFont(font).setFontSize(10));
            boxes.addCell(leftBox);
            boxes.addCell(rightBox);
            document.add(boxes);

            document.add(new Paragraph("U = DA")
                    .setFont(boldFont).setFontSize(9).setTextAlignment(TextAlignment.RIGHT).setMarginTop(2).setMarginBottom(4));

            // ── Tableau principal : feuille DAG si présente, sinon gabarit FOR 44 ──
            java.util.Map<String, Object> sheet = parseDevisSheet(quotation.getDevisBreakdownJson());
            if (sheet != null) {
                document.add(buildFromSheet(sheet, font, boldFont));
            } else {
                java.util.Map<String, java.math.BigDecimal> b = parseBreakdown(quotation.getDevisBreakdownJson());
                switch (type) {
                    case SURVEILLANCE -> document.add(buildSurveillanceTable(b, font, boldFont));
                    case EXTENSION -> document.add(buildExtensionTable(b, font, boldFont));
                    default -> document.add(buildInitialTable(b, type, font, boldFont));
                }
            }

            // ── N.B. ──
            document.add(new Paragraph("N.B :").setFont(boldFont).setFontSize(10).setMarginTop(8));
            document.add(new Paragraph("TVA = 19% : taux soumis à modification suivant règlementation en vigueur.")
                    .setFont(font).setFontSize(9));
            document.add(new Paragraph("CAS : comité d'accréditation spécialisé.")
                    .setFont(font).setFontSize(9));
            for (String note : nbNotes(type)) {
                document.add(new Paragraph(note).setFont(font).setFontSize(9).setMarginLeft(8));
            }

            if (quotation.getDagComments() != null && !quotation.getDagComments().isBlank()) {
                document.add(new Paragraph("Observations DAG :").setFont(boldFont).setFontSize(10).setMarginTop(6));
                document.add(new Paragraph(quotation.getDagComments()).setFont(font).setFontSize(9));
            }

            // ── Signatures ──
            document.add(new Paragraph(" ").setMarginTop(10));
            Table sig = new Table(UnitValue.createPercentArray(new float[]{60, 40})).useAllAvailableWidth();
            sig.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("LU et APPROUVE (le client)").setFont(boldFont).setFontSize(10))
                    .add(new Paragraph("Nom/fonction Cachet, Date et Visa").setFont(font).setFontSize(9)));
            sig.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .add(new Paragraph("ALGERAC").setFont(boldFont).setFontSize(11).setTextAlignment(TextAlignment.RIGHT)));
            document.add(sig);

            // ── Pied ──
            document.add(new Paragraph("Règlement s'effectue par : Virement bancaire, chèque libellé EPIC ALGERAC")
                    .setFont(font).setFontSize(8).setTextAlignment(TextAlignment.CENTER).setMarginTop(14));
            document.add(new Paragraph("Compte N° : 002000380382200108/50    Code SWIFT : BEXADZAL038")
                    .setFont(font).setFontSize(8).setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Domiciliation bancaire : banque BEA 00038    88, Rue Hassiba BEN BOUALI Alger")
                    .setFont(font).setFontSize(8).setTextAlignment(TextAlignment.CENTER));

            document.close();
            log.info("Devis estimatif {} généré pour la demande {}",
                    quotation.getQuotationNumber(),
                    request != null ? request.getReferenceNumber() : "?");
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur génération PDF devis estimatif", e);
            throw new RuntimeException("Erreur lors de la génération du devis estimatif", e);
        }
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, java.math.BigDecimal> parseBreakdown(String json) {
        java.util.LinkedHashMap<String, java.math.BigDecimal> out = new java.util.LinkedHashMap<>();
        if (json == null || json.isBlank()) return out;
        try {
            Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            Object amountsObj = raw.get("amounts");
            Map<String, Object> source = raw;
            if (amountsObj instanceof Map<?, ?> amountsMap) {
                source = (Map<String, Object>) amountsMap;
            }
            for (Map.Entry<String, Object> e : source.entrySet()) {
                if ("amounts".equals(e.getKey()) || "sheet".equals(e.getKey())) continue;
                if (e.getValue() == null) continue;
                try {
                    out.put(e.getKey(), new java.math.BigDecimal(e.getValue().toString()));
                } catch (NumberFormatException ignore) { /* skip */ }
            }
        } catch (Exception ex) {
            log.warn("Devis breakdown JSON illisible: {}", ex.getMessage());
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> parseDevisSheet(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            Object sheetObj = raw.get("sheet");
            if (sheetObj instanceof Map<?, ?> sheetMap) {
                Map<String, Object> sheet = (Map<String, Object>) sheetMap;
                if (sheet.get("columns") instanceof java.util.List && sheet.get("rows") instanceof java.util.List) {
                    return sheet;
                }
            }
        } catch (Exception ex) {
            log.warn("Devis sheet JSON illisible: {}", ex.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Table buildFromSheet(java.util.Map<String, Object> sheet, PdfFont font, PdfFont bold) {
        java.util.List<Map<String, Object>> columns = (java.util.List<Map<String, Object>>) sheet.get("columns");
        java.util.List<Map<String, Object>> rows = (java.util.List<Map<String, Object>>) sheet.get("rows");
        if (columns == null) columns = java.util.List.of();
        if (rows == null) rows = java.util.List.of();

        // Colonnes visibles PDF : phase, label, custom, ht, ttc (pas d'actions)
        java.util.List<Map<String, Object>> visibleCols = new java.util.ArrayList<>();
        for (Map<String, Object> c : columns) {
            String kind = str(c.get("kind"));
            if ("phase".equals(kind) || "label".equals(kind) || "ht".equals(kind)
                    || "ttc".equals(kind) || "text".equals(kind) || "number".equals(kind)) {
                visibleCols.add(c);
            }
        }
        if (visibleCols.isEmpty()) {
            return mainTable(); // fallback header only
        }

        float[] widths = new float[visibleCols.size()];
        for (int i = 0; i < visibleCols.size(); i++) {
            String kind = str(visibleCols.get(i).get("kind"));
            widths[i] = switch (kind) {
                case "phase" -> 12f;
                case "label" -> 40f;
                case "ht", "ttc" -> 16f;
                default -> 14f;
            };
        }

        Table t = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        com.itextpdf.kernel.colors.DeviceRgb hdr = new com.itextpdf.kernel.colors.DeviceRgb(200, 215, 230);
        for (Map<String, Object> c : visibleCols) {
            t.addHeaderCell(new Cell()
                    .add(new Paragraph(str(c.get("label"))).setFont(bold).setFontSize(9).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(hdr).setPadding(3));
        }

        // Pré-calcul HT par id de ligne + rowSpan phase
        java.util.Map<String, java.math.BigDecimal> htById = new java.util.HashMap<>();
        for (Map<String, Object> row : rows) {
            String kind = str(row.get("kind"));
            String id = str(row.get("id"));
            if ("line".equals(kind)) {
                htById.put(id, toBd(row.get("ht")));
            }
        }
        for (Map<String, Object> row : rows) {
            if (!"subtotal".equals(str(row.get("kind")))) continue;
            java.math.BigDecimal sum = java.math.BigDecimal.ZERO;
            Object sumIds = row.get("sumRowIds");
            if (sumIds instanceof java.util.List<?> ids) {
                for (Object oid : ids) {
                    java.math.BigDecimal v = htById.get(String.valueOf(oid));
                    if (v != null) sum = sum.add(v);
                }
            }
            htById.put(str(row.get("id")), sum);
        }

        java.util.List<Integer> phaseSpans = computePhaseRowSpans(rows);

        for (int ri = 0; ri < rows.size(); ri++) {
            Map<String, Object> row = rows.get(ri);
            String rowKind = str(row.get("kind"));
            boolean isSub = "subtotal".equals(rowKind);
            boolean isSec = "section".equals(rowKind);
            java.math.BigDecimal ht = htById.getOrDefault(str(row.get("id")), java.math.BigDecimal.ZERO);
            Map<String, Object> extra = row.get("extra") instanceof Map<?, ?>
                    ? (Map<String, Object>) row.get("extra") : java.util.Map.of();

            for (int ci = 0; ci < visibleCols.size(); ci++) {
                Map<String, Object> col = visibleCols.get(ci);
                String kind = str(col.get("kind"));
                String colId = str(col.get("id"));

                if ("phase".equals(kind)) {
                    int span = phaseSpans.get(ri);
                    if (span <= 0) continue; // covered by rowspan
                    if (isSec) {
                        t.addCell(phaseCell(str(row.get("phase")), span, bold));
                    } else if (str(row.get("phase")).isBlank() && isSub) {
                        t.addCell(new Cell(span, 1).setPadding(3));
                    } else {
                        t.addCell(phaseCell(str(row.get("phase")), span, bold));
                    }
                    continue;
                }

                if (isSec) {
                    // Une seule cellule libellé qui occupe le reste des colonnes
                    if ("label".equals(kind)) {
                        int rest = visibleCols.size() - ci;
                        t.addCell(new Cell(1, rest)
                                .add(new Paragraph(str(row.get("label"))).setFont(bold).setFontSize(9).setItalic())
                                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(225, 225, 225))
                                .setPadding(3));
                        break;
                    }
                    continue;
                }

                if ("label".equals(kind)) {
                    if (isSub) {
                        t.addCell(subtotalLabel(str(row.get("label")), 1, bold));
                    } else {
                        t.addCell(labelCell(str(row.get("label")), font));
                    }
                } else if ("ht".equals(kind)) {
                    if (isSub) t.addCell(subtotalAmount(ht, bold));
                    else t.addCell(amountCell(ht, font));
                } else if ("ttc".equals(kind)) {
                    java.math.BigDecimal ttcVal = ttc(ht);
                    if (isSub) t.addCell(subtotalAmount(ttcVal, bold));
                    else t.addCell(amountCell(ttcVal, font));
                } else {
                    String val = extra.get(colId) != null ? String.valueOf(extra.get(colId)) : "";
                    if (isSub) {
                        t.addCell(new Cell().add(new Paragraph("").setFont(font).setFontSize(9))
                                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(225, 225, 225)).setPadding(3));
                    } else {
                        t.addCell(labelCell(val, font));
                    }
                }
            }
        }
        return t;
    }

    private java.util.List<Integer> computePhaseRowSpans(java.util.List<Map<String, Object>> rows) {
        java.util.ArrayList<Integer> spans = new java.util.ArrayList<>();
        for (int i = 0; i < rows.size(); i++) spans.add(0);
        int i = 0;
        while (i < rows.size()) {
            String phase = str(rows.get(i).get("phase")).trim();
            if (phase.isEmpty()) {
                spans.set(i, 1);
                i++;
                continue;
            }
            int j = i + 1;
            while (j < rows.size() && phase.equals(str(rows.get(j).get("phase")).trim())) j++;
            spans.set(i, j - i);
            for (int k = i + 1; k < j; k++) spans.set(k, 0);
            i = j;
        }
        return spans;
    }

    private java.math.BigDecimal toBd(Object o) {
        if (o == null) return java.math.BigDecimal.ZERO;
        try {
            String s = String.valueOf(o).trim().replace(",", ".");
            if (s.isEmpty()) return java.math.BigDecimal.ZERO;
            return new java.math.BigDecimal(s);
        } catch (Exception e) {
            return java.math.BigDecimal.ZERO;
        }
    }

    private java.math.BigDecimal getOrZero(java.util.Map<String, java.math.BigDecimal> b, String key) {
        java.math.BigDecimal v = b.get(key);
        return v == null ? java.math.BigDecimal.ZERO : v;
    }

    private String fmt(java.math.BigDecimal v) {
        if (v == null) return "";
        return DA_FMT.format(v);
    }

    private java.math.BigDecimal ttc(java.math.BigDecimal ht) {
        if (ht == null) return null;
        return ht.add(ht.multiply(TVA_RATE)).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private Cell phaseCell(String label, int rowspan, PdfFont bold) {
        return new Cell(rowspan, 1).add(new Paragraph(label).setFont(bold).setFontSize(10))
                .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE)
                .setTextAlignment(TextAlignment.CENTER).setPadding(4);
    }

    private Cell labelCell(String txt, PdfFont font) {
        return new Cell().add(new Paragraph(txt).setFont(font).setFontSize(10)).setPadding(4);
    }

    private Cell amountCell(java.math.BigDecimal v, PdfFont font) {
        return new Cell().add(new Paragraph(fmt(v)).setFont(font).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)).setPadding(4);
    }

    private Cell subtotalLabel(String txt, int colspan, PdfFont bold) {
        return new Cell(1, colspan).add(new Paragraph(txt).setFont(bold).setFontSize(10)).setPadding(4)
                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(225, 225, 225));
    }

    private Cell subtotalAmount(java.math.BigDecimal v, PdfFont bold) {
        return new Cell().add(new Paragraph(fmt(v)).setFont(bold).setFontSize(10).setTextAlignment(TextAlignment.RIGHT)).setPadding(4)
                .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(225, 225, 225));
    }

    private Table mainTable() {
        Table t = new Table(UnitValue.createPercentArray(new float[]{12, 50, 19, 19})).useAllAvailableWidth();
        // Header
        PdfFont bold;
        try { bold = PdfFontFactory.createFont("Helvetica-Bold"); } catch (Exception e) { throw new RuntimeException(e); }
        com.itextpdf.kernel.colors.DeviceRgb hdr = new com.itextpdf.kernel.colors.DeviceRgb(200, 215, 230);
        for (String h : new String[]{"Phases", "Désignation", "Montant HT", "Montant TTC"}) {
            t.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(10).setTextAlignment(TextAlignment.CENTER))
                    .setBackgroundColor(hdr).setPadding(4));
        }
        return t;
    }

    private Table buildInitialTable(java.util.Map<String, java.math.BigDecimal> b,
                                    com.algerac.model.RequestType type,
                                    PdfFont font, PdfFont bold) {
        Table t = mainTable();
        boolean isInitial = type == com.algerac.model.RequestType.INITIAL;

        // Phase I — Frais d'inscription (uniquement INITIAL)
        if (isInitial) {
            t.addCell(phaseCell("Phase I", 1, bold));
            t.addCell(labelCell("Frais d'inscription du dossier (1)", font));
            java.math.BigDecimal v = getOrZero(b, "registrationFee");
            t.addCell(amountCell(v, font));
            t.addCell(amountCell(ttc(v), font));
        }

        // Phase II
        java.math.BigDecimal p2Analyse = getOrZero(b, "analysisFeeP2");
        java.math.BigDecimal p2Eval = getOrZero(b, "evaluationFeeP2");
        java.math.BigDecimal p2Total = p2Analyse.add(p2Eval);
        t.addCell(phaseCell("Phase II", 3, bold));
        t.addCell(labelCell("Frais d'Analyse documentaire", font));
        t.addCell(amountCell(p2Analyse, font));
        t.addCell(amountCell(ttc(p2Analyse), font));
        t.addCell(labelCell("Frais d'évaluation (2)", font));
        t.addCell(amountCell(p2Eval, font));
        t.addCell(amountCell(ttc(p2Eval), font));
        t.addCell(subtotalLabel("S/Total frais d'Accréditation. Phase II", 1, bold));
        t.addCell(subtotalAmount(p2Total, bold));
        t.addCell(subtotalAmount(ttc(p2Total), bold));

        // Phase III
        java.math.BigDecimal p3Cert = getOrZero(b, "certificateFeeP3");
        java.math.BigDecimal totalP2P3 = p2Total.add(p3Cert);
        t.addCell(phaseCell("Phase III", 2, bold));
        t.addCell(labelCell("Frais de délivrance du certificat et annexes", font));
        t.addCell(amountCell(p3Cert, font));
        t.addCell(amountCell(ttc(p3Cert), font));
        t.addCell(subtotalLabel("Total frais d'Accréditation. Phase II + Phase III", 1, bold));
        t.addCell(subtotalAmount(totalP2P3, bold));
        t.addCell(subtotalAmount(ttc(totalP2P3), bold));

        // Phase IV — Redevance annuelle
        java.math.BigDecimal annual = getOrZero(b, "annualFeeP4");
        t.addCell(phaseCell("Phase IV", 1, bold));
        t.addCell(labelCell("Redevance annuelle (Par année)", font));
        t.addCell(amountCell(annual, font));
        t.addCell(amountCell(ttc(annual), font));

        // Phase V — Surveillance
        java.math.BigDecimal p5Analyse = getOrZero(b, "analysisFeeP5");
        java.math.BigDecimal p5Eval = getOrZero(b, "evaluationFeeP5");
        java.math.BigDecimal p5Cas = getOrZero(b, "casFeeP5");
        java.math.BigDecimal totalSurv = p5Analyse.add(p5Eval).add(p5Cas);
        t.addCell(phaseCell("Phase V", 5, bold));
        t.addCell(subtotalLabel("Évaluation de surveillance (Par année)", 3, bold));
        t.addCell(labelCell("Frais d'Analyse documentaire", font));
        t.addCell(amountCell(p5Analyse, font));
        t.addCell(amountCell(ttc(p5Analyse), font));
        t.addCell(labelCell("Frais d'évaluation (2)", font));
        t.addCell(amountCell(p5Eval, font));
        t.addCell(amountCell(ttc(p5Eval), font));
        t.addCell(labelCell("Frais de modification du certificat et annexes (CAS) (3)", font));
        t.addCell(amountCell(p5Cas, font));
        t.addCell(amountCell(ttc(p5Cas), font));
        t.addCell(subtotalLabel("Total Frais de Surveillance", 1, bold));
        t.addCell(subtotalAmount(totalSurv, bold));
        t.addCell(subtotalAmount(ttc(totalSurv), bold));

        return t;
    }

    private Table buildSurveillanceTable(java.util.Map<String, java.math.BigDecimal> b, PdfFont font, PdfFont bold) {
        Table t = mainTable();
        java.math.BigDecimal p1Analyse = getOrZero(b, "analysisFeeP1");
        java.math.BigDecimal p1Eval = getOrZero(b, "evaluationFeeP1");
        java.math.BigDecimal p1Total = p1Analyse.add(p1Eval);
        java.math.BigDecimal p2Cas = getOrZero(b, "casFeeP2");
        java.math.BigDecimal grand = p1Total.add(p2Cas);

        t.addCell(phaseCell("Phase I", 3, bold));
        t.addCell(labelCell("Frais Analyse documentaire", font));
        t.addCell(amountCell(p1Analyse, font));
        t.addCell(amountCell(ttc(p1Analyse), font));
        t.addCell(labelCell("Frais d'évaluation (1)", font));
        t.addCell(amountCell(p1Eval, font));
        t.addCell(amountCell(ttc(p1Eval), font));
        t.addCell(subtotalLabel("S/TOTAL frais de surveillance", 1, bold));
        t.addCell(subtotalAmount(p1Total, bold));
        t.addCell(subtotalAmount(ttc(p1Total), bold));

        t.addCell(phaseCell("Phase II", 1, bold));
        t.addCell(labelCell("Frais de modification du certificat et annexes (CAS) (2)", font));
        t.addCell(amountCell(p2Cas, font));
        t.addCell(amountCell(ttc(p2Cas), font));

        t.addCell(subtotalLabel("Total Frais de surveillance (Phase I + Phase II)", 2, bold));
        t.addCell(subtotalAmount(grand, bold));
        t.addCell(subtotalAmount(ttc(grand), bold));
        return t;
    }

    private Table buildExtensionTable(java.util.Map<String, java.math.BigDecimal> b, PdfFont font, PdfFont bold) {
        Table t = mainTable();
        java.math.BigDecimal p1Analyse = getOrZero(b, "analysisFeeP1");
        java.math.BigDecimal p1Eval = getOrZero(b, "evaluationFeeP1");
        java.math.BigDecimal p1Total = p1Analyse.add(p1Eval);
        java.math.BigDecimal p2Cert = getOrZero(b, "certModFeeP2");
        java.math.BigDecimal p2Total = p2Cert; // sub-total Phase II
        java.math.BigDecimal annualExt = getOrZero(b, "annualExtensionFeeP3");
        java.math.BigDecimal nextAnnual = getOrZero(b, "nextAnnualFeeP3");
        java.math.BigDecimal p4Analyse = getOrZero(b, "analysisFeeP4");
        java.math.BigDecimal p4Eval = getOrZero(b, "evaluationFeeP4");
        java.math.BigDecimal p4Cas = getOrZero(b, "casFeeP4");
        java.math.BigDecimal totalSurv = p4Analyse.add(p4Eval).add(p4Cas);

        t.addCell(phaseCell("Phase I", 3, bold));
        t.addCell(labelCell("Frais analyse documentaire", font));
        t.addCell(amountCell(p1Analyse, font));
        t.addCell(amountCell(ttc(p1Analyse), font));
        t.addCell(labelCell("Frais d'évaluation (1)", font));
        t.addCell(amountCell(p1Eval, font));
        t.addCell(amountCell(ttc(p1Eval), font));
        t.addCell(subtotalLabel("S/Total Frais d'extension (Phase I)", 1, bold));
        t.addCell(subtotalAmount(p1Total, bold));
        t.addCell(subtotalAmount(ttc(p1Total), bold));

        t.addCell(phaseCell("Phase II", 2, bold));
        t.addCell(labelCell("Frais de modification du certificat ou annexes", font));
        t.addCell(amountCell(p2Cert, font));
        t.addCell(amountCell(ttc(p2Cert), font));
        t.addCell(subtotalLabel("S/Total Frais d'extension (Phase II)", 1, bold));
        t.addCell(subtotalAmount(p2Total, bold));
        t.addCell(subtotalAmount(ttc(p2Total), bold));

        t.addCell(phaseCell("Phase III", 2, bold));
        t.addCell(labelCell("Redevance annuelle sur extension (par année) (2)", font));
        t.addCell(amountCell(annualExt, font));
        t.addCell(amountCell(ttc(annualExt), font));
        t.addCell(labelCell("Prochaine redevance (INITIALE + EXTENSIONS)", font));
        t.addCell(amountCell(nextAnnual, font));
        t.addCell(amountCell(ttc(nextAnnual), font));

        t.addCell(phaseCell("Phase IV", 4, bold));
        t.addCell(subtotalLabel("Prochaine Évaluation de surveillance (INITIALE + EXTENSIONS) (par année)", 3, bold));
        t.addCell(labelCell("Frais Analyse documentaire", font));
        t.addCell(amountCell(p4Analyse, font));
        t.addCell(amountCell(ttc(p4Analyse), font));
        t.addCell(labelCell("Frais d'évaluation (1)", font));
        t.addCell(amountCell(p4Eval, font));
        t.addCell(amountCell(ttc(p4Eval), font));
        t.addCell(labelCell("Frais de modification du certificat et annexes (CAS) (3)", font));
        t.addCell(amountCell(p4Cas, font));
        t.addCell(amountCell(ttc(p4Cas), font));

        t.addCell(subtotalLabel("Total Frais de surveillance", 2, bold));
        t.addCell(subtotalAmount(totalSurv, bold));
        t.addCell(subtotalAmount(ttc(totalSurv), bold));
        return t;
    }

    private java.util.List<String> nbNotes(com.algerac.model.RequestType type) {
        java.util.List<String> n = new java.util.ArrayList<>();
        switch (type) {
            case SURVEILLANCE -> {
                n.add("(1) : Coût soumis à une modification en cas de nécessité d'évaluation complémentaire.");
                n.add("(2) : Dans les cas de changement ou de réduction avec passage au (CAS).");
                n.add("✓ En cas d'extension, le devis de surveillance de l'accréditation initiale sera modifié en fonction des nouveaux domaines, portées, grandeurs ou référentiels ajoutés.");
                n.add("✓ Les modalités de règlement sont définies dans l'annexe tarification. (Voir PRO 18).");
                n.add("✓ Les frais d'hébergement, de restauration et de transport des évaluateurs et des experts sont à la charge de l'OEC candidat à l'accréditation.");
            }
            case EXTENSION -> {
                n.add("(1) : Le coût soumis à une modification en cas de nécessité d'évaluation complémentaire.");
                n.add("(2) : La prochaine redevance sur extension sera cumulée à la redevance annuelle initiale.");
                n.add("(3) : Dans le cas de changement ou de réduction avec passage au CAS.");
                n.add("✓ Le devis de surveillance de l'accréditation initiale est modifié en fonction des nouveaux domaines, portées, grandeurs ou référentiels.");
                n.add("✓ Les modalités de règlement sont définies dans l'annexe tarification. (Voir PRO 18).");
                n.add("✓ Les frais d'hébergement, de restauration et de transport des évaluateurs et des experts sont à la charge de l'OEC candidat à l'accréditation.");
            }
            default -> {
                n.add("(1) : Les frais d'inscription sont exigés uniquement pour l'accréditation initiale et payables au moment du dépôt de la demande.");
                n.add("(2) : Coût soumis à une modification en cas de nécessité d'évaluation complémentaire.");
                n.add("(3) : Dans les cas de changement ou de réduction avec passage au (CAS).");
                n.add("✓ Le nombre de surveillance est de deux (02) par cycle pour une accréditation initiale et de trois (3) pour le renouvellement.");
                n.add("✓ En cas d'extension, le devis de surveillance de l'accréditation initiale sera modifié en fonction des nouveaux domaines, portées, grandeurs ou référentiels ajoutés.");
                n.add("✓ Les modalités de règlement sont définies dans l'annexe tarification. (Voir PRO 18).");
                n.add("✓ Les frais d'hébergement, de restauration et de transport des évaluateurs et des experts sont à la charge de l'OEC candidat à l'accréditation.");
            }
        }
        return n;
    }
}
