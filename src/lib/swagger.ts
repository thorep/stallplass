import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // App Router API folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Stallplass API",
        version: "1.0.0",
        description: "Norwegian marketplace connecting horse stable owners with riders. Stable owners manage facilities and create box (stall) listings. Only stables with active paid advertising appear in public search. Service providers (vets, farriers) can also advertise.",
        contact: {
          name: "Stallplass",
          url: "https://stallplass.no"
        }
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token from Supabase Auth"
          }
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Error message"
              },
              code: {
                type: "string",
                description: "Error code"
              }
            },
            required: ["error"]
          },
          Pagination: {
            type: "object",
            properties: {
              page: {
                type: "integer",
                description: "Current page number"
              },
              limit: {
                type: "integer", 
                description: "Items per page"
              },
              total: {
                type: "integer",
                description: "Total number of items"
              },
              pages: {
                type: "integer",
                description: "Total number of pages"
              }
            }
          },
          Profile: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                description: "Profile ID"
              },
              firstname: {
                type: "string",
                description: "First name"
              },
              middlename: {
                type: "string",
                nullable: true,
                description: "Middle name"
              },
              lastname: {
                type: "string", 
                description: "Last name"
              },
              nickname: {
                type: "string",
                nullable: true,
                description: "Display nickname"
              },
              phone: {
                type: "string",
                nullable: true,
                description: "Phone number"
              },
              isAdmin: {
                type: "boolean",
                description: "Whether user is an admin"
              }
            }
          },
          Stable: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              name: {
                type: "string"
              },
              description: {
                type: "string",
                nullable: true
              },
              location: {
                type: "string"
              },
              fylke: {
                type: "string",
                nullable: true
              },
              kommune: {
                type: "string", 
                nullable: true
              },
              tettsted: {
                type: "string",
                nullable: true
              },
              latitude: {
                type: "number",
                format: "float",
                nullable: true
              },
              longitude: {
                type: "number",
                format: "float", 
                nullable: true
              },
              email: {
                type: "string",
                format: "email",
                nullable: true
              },
              phone: {
                type: "string",
                nullable: true
              },
              website: {
                type: "string",
                format: "uri",
                nullable: true
              },
              hasActiveAdvertising: {
                type: "boolean",
                description: "Whether stable has active advertising and appears in public search"
              },
              createdAt: {
                type: "string",
                format: "date-time"
              },
              updatedAt: {
                type: "string",
                format: "date-time"
              }
            }
          },
          Box: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              name: {
                type: "string"
              },
              description: {
                type: "string",
                nullable: true
              },
              size: {
                type: "string",
                enum: ["small", "medium", "large", "extra_large"],
                description: "Box size category"
              },
              price: {
                type: "number",
                format: "float",
                description: "Monthly price in NOK"
              },
              available: {
                type: "boolean",
                description: "Whether box is currently available"
              },
              availableDate: {
                type: "string",
                format: "date",
                nullable: true,
                description: "Date when box becomes available"
              },
              isSponsored: {
                type: "boolean",
                description: "Whether box has paid promotion"
              },
              stableId: {
                type: "string",
                format: "uuid"
              },
              stable: {
                $ref: "#/components/schemas/Stable"
              }
            }
          },
          Service: {
            type: "object", 
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              title: {
                type: "string"
              },
              description: {
                type: "string",
                nullable: true
              },
              price: {
                type: "number",
                format: "float",
                nullable: true,
                description: "Service price in NOK"
              },
              location: {
                type: "string"
              },
              serviceType: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid"
                  },
                  name: {
                    type: "string"
                  }
                }
              },
              profileId: {
                type: "string",
                format: "uuid"
              }
            }
          },
          Horse: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              name: {
                type: "string"
              },
              breed: {
                type: "string",
                nullable: true
              },
              age: {
                type: "integer",
                nullable: true
              },
              gender: {
                type: "string",
                enum: ["mare", "stallion", "gelding"],
                nullable: true
              },
              description: {
                type: "string",
                nullable: true
              },
              slug: {
                type: "string",
                description: "URL-friendly identifier"
              },
              profileId: {
                type: "string",
                format: "uuid"
              }
            }
          },
          Conversation: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              lastMessage: {
                type: "string",
                nullable: true
              },
              lastMessageAt: {
                type: "string",
                format: "date-time",
                nullable: true
              },
              unreadCount: {
                type: "integer",
                description: "Number of unread messages for current user"
              },
              participants: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Profile"
                }
              }
            }
          },
          Message: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid"
              },
              content: {
                type: "string"
              },
              senderId: {
                type: "string",
                format: "uuid"
              },
              conversationId: {
                type: "string",
                format: "uuid"
              },
              createdAt: {
                type: "string",
                format: "date-time"
              },
              readAt: {
                type: "string",
                format: "date-time",
                nullable: true
              }
            }
          }
        }
      },
      security: [{ BearerAuth: [] }],
      servers: [
        {
          url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          description: "API Server"
        }
      ],
      tags: [
        {
          name: "Authentication",
          description: "User authentication and profile management"
        },
        {
          name: "Stables",
          description: "Stable management and listings"
        },
        {
          name: "Boxes", 
          description: "Horse box/stall management and search"
        },
        {
          name: "Services",
          description: "Service provider listings (vets, farriers, etc.)"
        },
        {
          name: "Horses",
          description: "Horse profiles and management"
        },
        {
          name: "Conversations",
          description: "Messaging between users"
        },
        {
          name: "Search",
          description: "Search functionality for boxes and services"
        },
        {
          name: "Locations",
          description: "Norwegian geographical data (fylker, kommuner, tettsteder)"
        },
        {
          name: "Pricing", 
          description: "Pricing calculations and discount management"
        },
        {
          name: "Analytics",
          description: "Page views and analytics tracking"
        },
        {
          name: "Admin",
          description: "Administrative functions (admin access required)"
        },
        {
          name: "Upload",
          description: "File upload functionality"
        }
      ]
    }
  })
  
  return spec
}