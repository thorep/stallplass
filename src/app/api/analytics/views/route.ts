import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import type { EntityType } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const entityType = searchParams.get('entityType') as EntityType;
    const entityId = searchParams.get('entityId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId is required' },
        { status: 400 }
      );
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    let analytics;

    if (entityId && entityType) {
      // Get views for a specific entity
      const { count: totalViews, error: countError } = await supabaseServer
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gte('created_at', dateFrom.toISOString());

      if (countError) {
        throw countError;
      }

      // Get individual views for grouping by day
      const { data: viewsData, error: viewsError } = await supabaseServer
        .from('page_views')
        .select('created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: true });

      if (viewsError) {
        throw viewsError;
      }

      // Group views by day (client-side aggregation)
      const viewsByDayMap = new Map<string, number>();
      viewsData?.forEach(view => {
        const date = new Date(view.created_at!).toISOString().split('T')[0];
        viewsByDayMap.set(date, (viewsByDayMap.get(date) || 0) + 1);
      });

      const viewsByDay = Array.from(viewsByDayMap.entries()).map(([date, views]) => ({
        date,
        views,
      })).sort((a, b) => a.date.localeCompare(b.date));

      analytics = {
        entityId,
        entityType,
        totalViews: totalViews || 0,
        viewsByDay,
      };
    } else {
      // Get aggregated views for all owner's entities
      const { data: stableIds, error: stableError } = await supabaseServer
        .from('stables')
        .select('id')
        .eq('owner_id', ownerId);

      if (stableError) {
        throw stableError;
      }

      const { data: boxIds, error: boxError } = await supabaseServer
        .from('boxes')
        .select('id, stable_id')
        .in('stable_id', stableIds?.map(s => s.id) || []);

      if (boxError) {
        throw boxError;
      }

      // Get all service IDs for this user
      const { data: serviceIds, error: serviceError } = await supabaseServer
        .from('services')
        .select('id')
        .eq('user_id', ownerId);

      if (serviceError) {
        throw serviceError;
      }

      const { count: stableViews, error: stableViewsError } = await supabaseServer
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'STABLE')
        .in('entity_id', stableIds?.map(s => s.id) || [])
        .gte('created_at', dateFrom.toISOString());

      if (stableViewsError) {
        throw stableViewsError;
      }

      const { count: boxViews, error: boxViewsError } = await supabaseServer
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'BOX')
        .in('entity_id', boxIds?.map(b => b.id) || [])
        .gte('created_at', dateFrom.toISOString());

      if (boxViewsError) {
        throw boxViewsError;
      }

      // Get service views count
      const { count: serviceViews, error: serviceViewsError } = await supabaseServer
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'SERVICE')
        .in('entity_id', serviceIds?.map(s => s.id) || [])
        .gte('created_at', dateFrom.toISOString());

      if (serviceViewsError) {
        throw serviceViewsError;
      }

      // Get detailed views by stable
      const stableViewsDetailed = await Promise.all(
        (stableIds || []).map(async (stable) => {
          const { count: views, error: viewsError } = await supabaseServer
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', 'STABLE')
            .eq('entity_id', stable.id)
            .gte('created_at', dateFrom.toISOString());

          if (viewsError) {
            throw viewsError;
          }

          const { data: stableInfo, error: stableError } = await supabaseServer
            .from('stables')
            .select('name')
            .eq('id', stable.id)
            .single();

          if (stableError) {
            throw stableError;
          }

          return {
            stableId: stable.id,
            stableName: stableInfo?.name || 'Unknown',
            views: views || 0,
          };
        })
      );

      // Get detailed views by box
      const boxViewsDetailed = await Promise.all(
        (boxIds || []).map(async (box) => {
          const { count: views, error: viewsError } = await supabaseServer
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', 'BOX')
            .eq('entity_id', box.id)
            .gte('created_at', dateFrom.toISOString());

          if (viewsError) {
            throw viewsError;
          }

          const { data: boxInfo, error: boxError } = await supabaseServer
            .from('boxes')
            .select(`
              name,
              stable:stables (
                name
              )
            `)
            .eq('id', box.id)
            .single();

          if (boxError) {
            throw boxError;
          }

          return {
            boxId: box.id,
            boxName: boxInfo?.name || 'Unknown',
            stableName: boxInfo?.stable ? (Array.isArray(boxInfo.stable) ? boxInfo.stable[0]?.name : (boxInfo.stable as { name?: string })?.name) || 'Unknown' : 'Unknown',
            views: views || 0,
          };
        })
      );

      // Get detailed views by service
      const serviceViewsDetailed = await Promise.all(
        (serviceIds || []).map(async (service) => {
          const { count: views, error: viewsError } = await supabaseServer
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', 'SERVICE')
            .eq('entity_id', service.id)
            .gte('created_at', dateFrom.toISOString());

          if (viewsError) {
            throw viewsError;
          }

          const { data: serviceInfo, error: serviceInfoError } = await supabaseServer
            .from('services')
            .select('title, service_type')
            .eq('id', service.id)
            .single();

          if (serviceInfoError) {
            throw serviceInfoError;
          }

          return {
            serviceId: service.id,
            serviceName: serviceInfo?.title || 'Unknown',
            serviceType: serviceInfo?.service_type || 'unknown',
            views: views || 0,
          };
        })
      );

      analytics = {
        summary: {
          totalStableViews: stableViews || 0,
          totalBoxViews: boxViews || 0,
          totalServiceViews: serviceViews || 0,
          totalViews: (stableViews || 0) + (boxViews || 0) + (serviceViews || 0),
        },
        stables: stableViewsDetailed,
        boxes: boxViewsDetailed,
        services: serviceViewsDetailed,
      };
    }

    return NextResponse.json(analytics);
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}