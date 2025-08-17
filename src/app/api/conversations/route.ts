import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     description: |
 *       Retrieves all conversations where the user is either:
 *       - The rider (user.id matches)
 *       - The stable owner (owns a stable involved in the conversation)
 *       
 *       Each conversation includes the latest message and unread message count.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's conversations with latest messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Conversation ID
 *                   user.id:
 *                     type: string
 *                     description: ID of the rider user
 *                   stableId:
 *                     type: string
 *                     description: ID of the stable
 *                   boxId:
 *                     type: string
 *                     nullable: true
 *                     description: ID of the specific box (if applicable)
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                   stable:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       ownerId:
 *                         type: string
 *                       profiles:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nickname:
 *                             type: string
 *                   box:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       isAvailable:
 *                         type: boolean
 *                   messages:
 *                     type: array
 *                     description: Array with latest message (if any)
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         messageType:
 *                           type: string
 *                           enum: [TEXT, IMAGE, SYSTEM]
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         isRead:
 *                           type: boolean
 *                   _count:
 *                     type: object
 *                     properties:
 *                       messages:
 *                         type: integer
 *                         description: Number of unread messages for this user
 *             example:
 *               - id: "conv123"
 *                 user.id: "user456"
 *                 stableId: "stable789"
 *                 boxId: "box101"
 *                 user:
 *                   id: "user456"
 *                   nickname: "Ola Nordmann"
 *                 stable:
 *                   name: "Eidsvoll Ridestall"
 *                   profiles:
 *                     nickname: "Kari Stall"
 *                 box:
 *                   name: "Boks 12"
 *                   price: 4500
 *                 messages:
 *                   - content: "Hei, er boksen ledig?"
 *                     messageType: "TEXT"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                 _count:
 *                   messages: 2
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new conversation
 *     description: |
 *       Creates a new conversation between a rider and a stable owner.
 *       If a conversation already exists for the same user/stable/box combination,
 *       returns the existing conversation instead of creating a duplicate.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stableId
 *               - initialMessage
 *             properties:
 *               stableId:
 *                 type: string
 *                 description: ID of the stable to contact
 *               boxId:
 *                 type: string
 *                 nullable: true
 *                 description: ID of specific box (optional)
 *               initialMessage:
 *                 type: string
 *                 description: First message content
 *                 minLength: 1
 *           example:
 *             stableId: "stable789"
 *             boxId: "box101"
 *             initialMessage: "Hei! Er denne boksen ledig for langtidsleie?"
 *     responses:
 *       200:
 *         description: Conversation created or existing conversation returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user.id:
 *                   type: string
 *                 stableId:
 *                   type: string
 *                 boxId:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                 stable:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     profiles:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         nickname:
 *                           type: string
 *                 box:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request - missing required fields or trying to message own stable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: "Stable ID and initial message are required"
 *               ownStable:
 *                 value:
 *                   error: "Du kan ikke sende melding til din egen stall"
 *       404:
 *         description: Stable not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Stable not found"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

export async function GET() {
  console.log('[GET /api/conversations] Request received');
  
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    console.log('[GET /api/conversations] Auth failed');
    return authResult;
  }
  const user = authResult;
  console.log('[GET /api/conversations] Authenticated user:', user.id);
  
  try {
    // First get stable IDs owned by this user
    const ownedStables = await prisma.stables.findMany({
      where: { ownerId: user.id },
      select: { id: true }
    });
    
    const ownedStableIds = ownedStables.map(s => s.id);

    // Get service IDs owned by this user
    const ownedServices = await prisma.services.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    
    const ownedServiceIds = ownedServices.map(s => s.id);

    // Get part-loan horse IDs owned by this user
    const ownedPartLoanHorses = await prisma.part_loan_horses.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    
    const ownedPartLoanHorseIds = ownedPartLoanHorses.map(h => h.id);

    // Get horse sale IDs owned by this user
    const ownedHorseSales = await prisma.horse_sales.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    
    const ownedHorseSaleIds = ownedHorseSales.map(h => h.id);

    // Get conversations where user is either rider, stable owner, service owner, part-loan horse owner, or horse sale owner
    const whereCondition = {
      OR: [
        { userId: user.id },
        ...(ownedStableIds.length > 0 ? [{ stableId: { in: ownedStableIds } }] : []),
        ...(ownedServiceIds.length > 0 ? [{ serviceId: { in: ownedServiceIds } }] : []),
        ...(ownedPartLoanHorseIds.length > 0 ? [{ partLoanHorseId: { in: ownedPartLoanHorseIds } }] : []),
        ...(ownedHorseSaleIds.length > 0 ? [{ horseSaleId: { in: ownedHorseSaleIds } }] : [])
      ]
    };

    const conversations = await prisma.conversations.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            nickname: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true,
            availableQuantity: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            contactName: true,
            userId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        partLoanHorse: {
          select: {
            id: true,
            name: true,
            userId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        horseSale: {
          select: {
            id: true,
            name: true,
            userId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get latest message and unread count for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        // Get latest message
        const latestMessage = await prisma.messages.findFirst({
          where: { conversationId: conversation.id },
          select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            isRead: true
          },
          orderBy: { createdAt: 'desc' }
        });

        // Get unread count
        const unreadCount = await prisma.messages.count({
          where: {
            conversationId: conversation.id,
            isRead: false,
            senderId: { not: user.id }
          }
        });

        return {
          ...conversation,
          messages: latestMessage ? [latestMessage] : [],
          _count: {
            messages: unreadCount
          }
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error: unknown) {
    console.error('[GET /api/conversations] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[POST /api/conversations] Request received');
  
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    console.log('[POST /api/conversations] Auth failed');
    return authResult;
  }
  const user = authResult;
  console.log('[POST /api/conversations] Authenticated user:', user.id);
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/conversations] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('[POST /api/conversations] Request body:', JSON.stringify(body));
    const { stableId: originalStableId, boxId, serviceId, partLoanHorseId, horseSaleId, initialMessage } = body;
    let stableId = originalStableId;

    // Always require initial message
    if (!initialMessage || !initialMessage.trim()) {
      console.error('[POST /api/conversations] Missing initial message');
      return NextResponse.json(
        { error: 'Initial message is required' },
        { status: 400 }
      );
    }

    // If only boxId is provided, look up the stableId
    if (boxId && !stableId && !serviceId && !partLoanHorseId && !horseSaleId) {
      console.log('[POST /api/conversations] Only boxId provided, looking up stableId for box:', boxId);
      const box = await prisma.boxes.findUnique({
        where: { id: boxId },
        select: { stableId: true }
      });
      
      if (!box) {
        console.error('[POST /api/conversations] Box not found:', boxId);
        return NextResponse.json(
          { error: 'Box not found', boxId },
          { status: 404 }
        );
      }
      
      stableId = box.stableId;
      console.log('[POST /api/conversations] Found stableId for box:', stableId);
    }

    if (!stableId && !serviceId && !partLoanHorseId && !horseSaleId) {
      console.error('[POST /api/conversations] Missing required ID fields');
      console.error('  stableId:', stableId);
      console.error('  serviceId:', serviceId);
      console.error('  partLoanHorseId:', partLoanHorseId);
      console.error('  horseSaleId:', horseSaleId);
      console.error('  boxId:', boxId);
      console.error('  Full body:', JSON.stringify(body));
      
      
      return NextResponse.json(
        { error: 'Either stable ID, service ID, part loan horse ID, or horse sale ID is required' },
        { status: 400 }
      );
    }

    // Check if user is trying to message their own stable or service
    if (stableId) {
      const stable = await prisma.stables.findUnique({
        where: { id: stableId },
        select: { ownerId: true }
      });

      if (!stable) {
        console.error('[POST /api/conversations] Stable not found:', stableId);
        return NextResponse.json(
          { error: 'Stable not found', stableId },
          { status: 404 }
        );
      }

      if (stable.ownerId === user.id) {
        console.log('[POST /api/conversations] User trying to message own stable');
        console.log('  stable.ownerId:', stable.ownerId);
        console.log('  user.id:', user.id);
        return NextResponse.json(
          { error: 'Du kan ikke sende melding til din egen stall' },
          { status: 400 }
        );
      }
    }

    if (serviceId) {
      const service = await prisma.services.findUnique({
        where: { id: serviceId },
        select: { userId: true }
      });

      if (!service) {
        console.error('[POST /api/conversations] Service not found:', serviceId);
        return NextResponse.json(
          { error: 'Service not found', serviceId },
          { status: 404 }
        );
      }

      if (service.userId === user.id) {
        console.log('[POST /api/conversations] User trying to message own service');
        console.log('  service.userId:', service.userId);
        console.log('  user.id:', user.id);
        return NextResponse.json(
          { error: 'Du kan ikke sende melding til din egen tjeneste' },
          { status: 400 }
        );
      }
    }

    if (partLoanHorseId) {
      const partLoanHorse = await prisma.part_loan_horses.findUnique({
        where: { id: partLoanHorseId },
        select: { userId: true }
      });

      if (!partLoanHorse) {
        console.error('[POST /api/conversations] Part loan horse not found:', partLoanHorseId);
        return NextResponse.json(
          { error: 'Part loan horse not found', partLoanHorseId },
          { status: 404 }
        );
      }

      if (partLoanHorse.userId === user.id) {
        console.log('[POST /api/conversations] User trying to message own part loan horse');
        console.log('  partLoanHorse.userId:', partLoanHorse.userId);
        console.log('  user.id:', user.id);
        return NextResponse.json(
          { error: 'Du kan ikke sende melding til din egen fôrhest' },
          { status: 400 }
        );
      }
    }

    if (horseSaleId) {
      const horseSale = await prisma.horse_sales.findUnique({
        where: { id: horseSaleId },
        select: { userId: true }
      });

      if (!horseSale) {
        console.error('[POST /api/conversations] Horse sale not found:', horseSaleId);
        return NextResponse.json(
          { error: 'Horse sale not found', horseSaleId },
          { status: 404 }
        );
      }

      if (horseSale.userId === user.id) {
        console.log('[POST /api/conversations] User trying to message own horse sale');
        console.log('  horseSale.userId:', horseSale.userId);
        console.log('  user.id:', user.id);
        return NextResponse.json(
          { error: 'Du kan ikke sende melding til din egen hest til salgs' },
          { status: 400 }
        );
      }
    }

    // Check if conversation already exists
    let whereClause;
    if (serviceId) {
      whereClause = {
        userId: user.id,
        serviceId: serviceId
      };
    } else if (partLoanHorseId) {
      whereClause = {
        userId: user.id,
        partLoanHorseId: partLoanHorseId
      };
    } else if (horseSaleId) {
      whereClause = {
        userId: user.id,
        horseSaleId: horseSaleId
      };
    } else {
      whereClause = {
        userId: user.id,
        stableId: stableId,
        boxId: boxId || null
      };
    }

    const existingConversation = await prisma.conversations.findFirst({
      where: whereClause
    });

    if (existingConversation) {
      console.log('[POST /api/conversations] Returning existing conversation:', existingConversation.id);
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    console.log('[POST /api/conversations] Creating new conversation');
    console.log('  userId:', user.id);
    console.log('  stableId:', stableId);
    console.log('  boxId:', boxId);
    console.log('  serviceId:', serviceId);
    console.log('  partLoanHorseId:', partLoanHorseId);
    console.log('  horseSaleId:', horseSaleId);
    
    const conversation = await prisma.conversations.create({
      data: {
        userId: user.id,
        stableId: stableId || null,
        boxId: boxId || null,
        serviceId: serviceId || null,
        partLoanHorseId: partLoanHorseId || null,
        horseSaleId: horseSaleId || null,
        updatedAt: new Date()
      }
    });

    // Create the initial message (now always required)
    await prisma.messages.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: initialMessage.trim(),
        messageType: 'TEXT'
      }
    });

    // Fetch the complete conversation with all relations
    const completeConversation = await prisma.conversations.findUnique({
      where: { id: conversation.id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            contactName: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        partLoanHorse: {
          select: {
            id: true,
            name: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        horseSale: {
          select: {
            id: true,
            name: true,
            userId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        messages: true
      }
    });

    console.log('[POST /api/conversations] Successfully created conversation:', conversation.id);
    return NextResponse.json(completeConversation);
  } catch (error: unknown) {
    console.error('[POST /api/conversations] Error:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[POST /api/conversations] Error message:', error.message);
      console.error('[POST /api/conversations] Error stack:', error.stack);
    }
    
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}