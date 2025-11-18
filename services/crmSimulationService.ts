
// Simulates a rich CRM database lookup

const crmDatabase: Record<string, any> = {
  "Ahmet Bey": {
    customerId: "CUST12345",
    fullName: "Ahmet Engin",
    tier: "Platinum",
    preferences: {
      airline: "THY",
      class_preference: "Business",
      seat_preference: "1A, Aisle",
      meal_preference: "Vegetarian",
    },
    loyalty: {
      miles_card: "TK123456789",
      miles_balance: 150000,
    },
    family: {
      spouse: "Ayşe Engin",
      children: ["Efe Engin", "Ela Engin"],
    },
    assets: [
      {
        type: "yacht",
        id: "ada.sea.yacht.wim",
        name: "Wim",
        home_port: "Gocek, Turkey",
        current_location: "Monaco",
      },
    ],
    financial: {
      payment_method: "Amex Centurion",
      credit_status: "Excellent",
    },
    notes: "Always books last-minute. Prefers direct flights. Eşi'nin doğum günü 15 Mayıs.",
  },
  "Default User": {
      customerId: "CUST_DEFAULT",
      fullName: "Default User",
      tier: "Standard",
      preferences: {},
      loyalty: {},
      assets: [],
      financial: { payment_method: "Visa", credit_status: "Good" },
      notes: "No specific preferences on file."
  }
};

export const fetchCustomerProfile = async (customerName: string): Promise<any | null> => {
    console.log(`[CRM Simulation] Looking up profile for: ${customerName}`);
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500)); // Simulate network latency
    const profile = crmDatabase[customerName] || crmDatabase["Default User"];
    console.log(`[CRM Simulation] Found profile:`, profile);
    return profile;
}