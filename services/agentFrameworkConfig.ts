import { AgentFrameworkConfig } from '../types';

export const AGENT_FRAMEWORK_CONFIG: AgentFrameworkConfig = {
  tools: {
    // CRM Tools
    customer_lookup: { id: "customer_lookup", description: "Müşteri veritabanında profil arar." },
    // Travel Tools (Turkish Airlines)
    tk_verify_customer: { id: "tk_verify_customer", description: "TK Miles&Smiles üyeliğini doğrular." },
    tk_check_miles: { id: "tk_check_miles", description: "Müşterinin mil durumunu kontrol eder." },
    tk_search_flights: { id: "tk_search_flights", description: "Turkish Airlines uçuşlarını arar." },
    // Travel Tools (Generic)
    gds_flight_search: { id: "gds_flight_search", description: "Amadeus/Sabre üzerinden uçuş arar." },
    aggregator_flight_search: { id: "aggregator_flight_search", description: "Toplayıcılardan (örn. Kayak) uçuş arar." },
    // Maritime Tools
    check_marina_availability: { id: "check_marina_availability", description: "Marina'da tekne için yer kontrol eder." },
    provision_yacht: { id: "provision_yacht", description: "Yat için erzak ve hizmet organize eder." },
    // Finance Tools
    check_credit: { id: "check_credit", description: "Müşterinin kredi limitini kontrol eder." },
    process_payment: { id: "process_payment", description: "Ödeme işlemini gerçekleştirir." },
  },
  providers: {
    // CRM
    internal_crm: { id: "internal_crm", description: "Ada Internal CRM Database", supportedToolIds: ["customer_lookup"] },
    // Travel
    turkish_airlines: { id: "turkish_airlines", description: "Turkish Airlines Direct Connect", supportedToolIds: ["tk_verify_customer", "tk_check_miles", "tk_search_flights"] },
    amadeus: { id: "amadeus", description: "Amadeus GDS", supportedToolIds: ["gds_flight_search"] },
    sabre: { id: "sabre", description: "Sabre GDS", supportedToolIds: ["gds_flight_search"] },
    // Maritime
    port_hercule_monaco: { id: "port_hercule_monaco", description: "Port Hercule, Monaco Marina Authority", supportedToolIds: ["check_marina_availability"] },
    yacht_services_inc: { id: "yacht_services_inc", description: "Global Yacht Provisioning Inc.", supportedToolIds: ["provision_yacht"] },
    // Finance
    internal_finance: { id: "internal_finance", description: "Ada Internal Payment Gateway", supportedToolIds: ["check_credit", "process_payment"] },
  },
  modules: {
    crm_agent: {
      skills: [
        { id: "fetch_customer_profile", description: "Müşteri Profili Getir", providerIds: ["internal_crm"] }
      ],
      voting_strategy: "first_success",
      red_flagging: false,
    },
    travel_agent: {
      skills: [
        { id: "flight_booking", description: "Uçuş Rezervasyonu", providerIds: ["turkish_airlines", "amadeus", "sabre"] },
      ],
      voting_strategy: "plurality",
      red_flagging: true
    },
    maritime_agent: {
        skills: [
            { id: "marina_booking", description: "Marina Rezervasyonu", providerIds: ["port_hercule_monaco"] },
            { id: "yacht_provisioning", description: "Yat Tedarik", providerIds: ["yacht_services_inc"] }
        ],
        voting_strategy: "first_success",
        red_flagging: true
    },
    finance_agent: {
        skills: [
            { id: "handle_payment", description: "Ödeme Yönetimi", providerIds: ["internal_finance"]}
        ],
        voting_strategy: "first_success",
        red_flagging: true
    }
  },
  general: {
    auto_seal: true,
    run_interval_hours: 24,
    log_dir: "./logs",
    temp_dir: "./temp",
    adapter_update: true
  }
};
